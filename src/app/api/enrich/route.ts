// =============================================================================
// AI Radar — AI Enrichment API Route (Phase 4)
// POST /api/enrich & GET /api/enrich
// =============================================================================
// Server-side endpoint for triggering manual or batch AI enrichment.
//
// SECURITY:
//   - Requires COLLECTION_SECRET header in production
//   - Allows local development without secret (logs warning)
//   - Server-side only: never exposed directly to browser in public SaaS mode
//   - All input content is sanitized before LLM transmission
//   - Cost capped by maximum batch size limits
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { enrichItemById, enrichBatch } from '@/lib/ai/enrichmentService';
import { getAIProvider, getProviderStatuses } from '@/lib/ai/providers';
import { CURRENT_PROMPT_VERSION } from '@/lib/ai/prompts';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { getItemsPendingEnrichment } from '@/lib/repositories/itemRepository';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.COLLECTION_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (!secret) {
    if (isDev) {
      logger.warn('[EnrichRoute] COLLECTION_SECRET not set — allowing in development only');
      return true;
    }
    return false;
  }

  const providedSecret = request.headers.get('x-collection-secret');
  return providedSecret === secret;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Authorization check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide x-collection-secret header.' },
      { status: 401 }
    );
  }

  // 2. Database prerequisites
  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    return NextResponse.json(
      { error: 'Database or service key not configured in .env.local' },
      { status: 503 }
    );
  }

  // 3. Parse request payload
  let body: { itemId?: string; forceRegenerate?: boolean; limit?: number } = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    if (body.itemId) {
      // Single-item enrichment
      logger.info(`[EnrichRoute] Triggering single-item enrichment: ${body.itemId}`);
      const result = await enrichItemById(body.itemId, {
        forceRegenerate: body.forceRegenerate,
      });

      return NextResponse.json({
        ok: result.ok,
        durationMs: Date.now() - startTime,
        result,
      });
    } else {
      // Batch enrichment
      const limit = Math.min(body.limit ?? 5, 20);
      logger.info(`[EnrichRoute] Triggering batch enrichment (limit: ${limit})`);
      const batchResult = await enrichBatch({
        limit,
        forceRegenerate: body.forceRegenerate,
      });

      return NextResponse.json({
        ok: true,
        ...batchResult,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[EnrichRoute] Unexpected error during enrichment', err);
    return NextResponse.json(
      { error: `Enrichment failed: ${msg}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeProvider = getAIProvider();
  const providerStatuses = await getProviderStatuses();
  const pendingCandidates = isDatabaseConfigured() ? await getItemsPendingEnrichment(50) : [];

  return NextResponse.json({
    activeProvider: {
      id: activeProvider.id,
      displayName: activeProvider.displayName,
      model: process.env.AI_MODEL || activeProvider.defaultModel,
    },
    promptVersion: CURRENT_PROMPT_VERSION,
    pendingEnrichmentCount: pendingCandidates.length,
    providers: providerStatuses,
  });
}
