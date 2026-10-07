// =============================================================================
// AI Radar — Bookmarks API Route
// GET, POST, DELETE /api/bookmarks
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  createBookmark,
  removeBookmark,
  getUserBookmarks,
} from '@/lib/repositories/bookmarkRepository';
import {
  saveIntelligence,
  unsaveIntelligence,
} from '@/lib/repositories/personalizationRepository';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const result = await getUserBookmarks(userId, page, pageSize);
    return NextResponse.json({
      ok: true,
      items: result.data,
      total: result.total,
      itemIds: result.data.map((i) => i.id),
    });
  } catch (err: any) {
    logger.error('Failed to get user bookmarks', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const body = await request.json();
    const itemId = body.itemId || body.item_id || body.entity_id;

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'itemId is required and must be a string' },
        { status: 400 }
      );
    }

    // Save to primary bookmarks repository
    const success = await createBookmark(userId, itemId);

    // Also persist into saved intelligence table if title or metadata provided
    const item = body.item || body;
    const title = item.title || body.title || 'Saved Story';
    try {
      await saveIntelligence(userId, {
        entityType: 'item',
        entityId: itemId,
        title: String(title).slice(0, 300),
        notes: item.description ? String(item.description).slice(0, 1000) : null,
        metadata: {
          canonicalUrl: item.canonicalUrl || item.canonical_url,
          sourceName: item.sourceName || item.source?.name,
          publishedAt: item.publishedAt || item.published_at,
          categories: item.categories,
        },
      });
    } catch (saveErr) {
      logger.warn('Non-fatal: could not dual-write saved intelligence', { saveErr });
    }

    return NextResponse.json({ ok: true, isBookmarked: true, success });
  } catch (err: any) {
    logger.error('Failed to create bookmark', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const { searchParams } = new URL(request.url);
    let itemId = searchParams.get('itemId') || searchParams.get('id');

    if (!itemId) {
      try {
        const body = await request.json();
        itemId = body.itemId || body.item_id || body.id;
      } catch {}
    }

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    await removeBookmark(userId, itemId);
    try {
      await unsaveIntelligence(userId, 'item', itemId);
    } catch {}

    return NextResponse.json({ ok: true, isBookmarked: false, itemId });
  } catch (err: any) {
    logger.error('Failed to remove bookmark', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
