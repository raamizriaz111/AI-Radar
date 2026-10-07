// =============================================================================
// AI Radar — Trends API Route (Phase 5)
// GET /api/trends & POST /api/trends
// =============================================================================
// Allows fetching detected trends and triggering trend discovery.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAllTrends, saveTrendsBatch } from '@/lib/repositories/trendRepository';
import { queryItems } from '@/lib/repositories/itemRepository';
import { discoverTrends } from '@/lib/intelligence/trendDiscovery';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.COLLECTION_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (secret) {
    const providedSecret = request.headers.get('x-collection-secret');
    if (providedSecret === secret) return true;
  }

  if (isDev) return true;

  // Allow requests from same host/origin (e.g. browser UI actions)
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const confidence = searchParams.get('confidence') as any;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const autoDiscover = searchParams.get('discover') === 'true';

    let trends = await getAllTrends({ status, confidence, limit });

    // If no trends exist yet or autoDiscover requested, run discovery on recent items
    if ((trends.length === 0 || autoDiscover) && isAuthorized(request)) {
      const itemsRes = await queryItems({ page: 1, pageSize: 80 });
      if (itemsRes.data.length > 0) {
        const discovered = await discoverTrends(itemsRes.data);
        if (discovered.length > 0) {
          await saveTrendsBatch(discovered);
          trends = await getAllTrends({ status, confidence, limit });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      count: trends.length,
      trends,
    });
  } catch (err: any) {
    logger.error('Failed to get trends', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide x-collection-secret header.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const windowDays = searchParams.get('windowDays')
      ? parseInt(searchParams.get('windowDays')!, 10)
      : 21;

    // Fetch items to analyze
    const itemsRes = await queryItems({ page: 1, pageSize: 100 });
    const items = itemsRes.data;

    if (items.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No items available in database to discover trends from.',
        discoveredCount: 0,
      });
    }

    const candidates = await discoverTrends(items, windowDays);
    const savedCount = await saveTrendsBatch(candidates);

    return NextResponse.json({
      ok: true,
      itemsAnalyzed: items.length,
      discoveredCount: candidates.length,
      savedCount,
      trends: candidates.map((c) => ({
        slug: c.slug,
        title: c.title,
        status: c.status,
        confidence: c.confidence,
        confidenceScore: c.confidenceScore,
        itemCount: c.itemCount,
        distinctSourceCount: c.distinctSourceCount,
      })),
    });
  } catch (err: any) {
    logger.error('Failed to discover trends', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
