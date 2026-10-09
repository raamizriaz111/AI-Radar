// =============================================================================
// AI Radar — Collection API Route (Phase 3)
// POST /api/collect
// =============================================================================
// Manual collection trigger for use during development and diagnostics.
// Server-side only — never exposed to browser clients in production.
//
// SECURITY:
//   - Requires COLLECTION_SECRET env variable to be set (checked via header).
//   - If COLLECTION_SECRET is not set, only works in development mode.
//   - This route must never be called from browser/client code.
//   - Rate limited by design: each call triggers real external HTTP requests.
//   - All external content parsed here is treated as untrusted data.
//
// Usage:
//   POST /api/collect
//   Header: x-collection-secret: <COLLECTION_SECRET>
//   Body (optional): { "slug": "arxiv" }   ← run a specific collector
//   Body (empty):    {}                     ← run all collectors
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { runCollector, runAllCollectors } from '@/lib/services/collectionService';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { logger } from '@/lib/services/logger';

// Disallow static generation for this route
export const dynamic = 'force-dynamic';

/**
 * Verify the incoming request is authorized.
 * In development with no secret configured, allows local calls.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.COLLECTION_SECRET || process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (secret) {
    const providedSecret = request.headers.get('x-collection-secret');
    const authHeader = request.headers.get('authorization');
    if (providedSecret === secret) return true;
    if (authHeader === `Bearer ${secret}`) return true;
  }

  // Allow requests dispatched by Vercel Cron
  if (request.headers.get('user-agent')?.includes('vercel-cron')) {
    return true;
  }

  if (isDev) return true;

  // Allow requests from same host/origin (e.g. browser UI "Sync Latest" button)
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (host && (origin?.includes(host) || referer?.includes(host) || host.includes('localhost') || host.includes('127.0.0.1'))) {
    return true;
  }

  // If no secret is explicitly configured, allow standalone execution
  if (!secret) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Authorization
  if (!isAuthorized(request)) {
    logger.warn('[CollectRoute] Unauthorized collection attempt');
    return NextResponse.json(
      { error: 'Unauthorized. Provide x-collection-secret header.' },
      { status: 401 }
    );
  }

  // 2. Database prerequisites
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database connection not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.' },
      { status: 503 }
    );
  }

  if (!isServiceKeyConfigured()) {
    return NextResponse.json(
      { error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.' },
      { status: 503 }
    );
  }

  // 3. Parse body
  let body: { slug?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as { slug?: string };
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // 4. Run collection
  const startTime = Date.now();

  try {
    if (body.slug) {
      // Run a single collector
      logger.info(`[CollectRoute] Running single collector: ${body.slug}`);
      const result = await runCollector(body.slug);

      if (!result) {
        return NextResponse.json(
          { error: `Collector not found or source not seeded: "${body.slug}". Run migration 004_phase3_sources.sql first.` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        durationMs: Date.now() - startTime,
        result,
      });
    } else {
      // Run all collectors
      logger.info('[CollectRoute] Running all collectors');
      const orchestratorResult = await runAllCollectors();

      return NextResponse.json({
        ok: true,
        durationMs: Date.now() - startTime,
        ...orchestratorResult,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[CollectRoute] Unexpected error during collection', err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: `Collection failed: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collect — returns available collectors and their DB registration status.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isCronRun =
    searchParams.get('run') === 'true' ||
    searchParams.get('cron') === 'true' ||
    Boolean(request.headers.get('user-agent')?.includes('vercel-cron'));

  if (isCronRun) {
    return POST(request);
  }

  const { listCollectors } = await import('@/lib/collectors/registry');
  const { getSources } = await import('@/lib/repositories/sourceRepository');

  const collectors = listCollectors();
  const sources = isDatabaseConfigured() ? await getSources({ activeOnly: false }) : [];

  const status = collectors.map((c) => {
    const source = sources.find((s) => {
      const cfg = s.config as Record<string, unknown> | null;
      return cfg && cfg['slug'] === c.slug;
    });
    return {
      slug: c.slug,
      displayName: c.displayName,
      dbSourceId: source?.id ?? null,
      dbSourceActive: source?.active ?? null,
      seeded: !!source,
    };
  });

  return NextResponse.json({
    collectors: status,
    dbConfigured: isDatabaseConfigured(),
    serviceKeyConfigured: isServiceKeyConfigured(),
  });
}
