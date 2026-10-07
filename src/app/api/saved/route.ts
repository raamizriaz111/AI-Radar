// =============================================================================
// AI Radar — Saved Intelligence Portfolio API Route (Phase 7 Section 15)
// GET, POST, DELETE /api/saved
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  saveIntelligence,
  unsaveIntelligence,
  getSavedIntelligence,
} from '@/lib/repositories/personalizationRepository';
import { createBookmark, removeBookmark } from '@/lib/repositories/bookmarkRepository';
import { SavedIntelligenceSchema } from '@/lib/validation/schemas';
import { SavedEntityType } from '@/lib/types';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') as SavedEntityType | undefined;

    const savedItems = await getSavedIntelligence(userId, entityType || undefined);
    return NextResponse.json({ ok: true, savedItems });
  } catch (err: any) {
    logger.error('Failed to get saved intelligence', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const body = await request.json();

    // Support shorthand { itemId } from client bookmark toggles
    const entityType = body.entity_type || (body.itemId ? 'item' : undefined);
    const entityId = body.entity_id || body.itemId;
    const title = body.title || body.item?.title || 'Saved Story';

    if (body.itemId) {
      await createBookmark(userId, body.itemId);
    }

    const validated = SavedIntelligenceSchema.parse({
      entity_type: entityType,
      entity_id: entityId,
      title: title,
      notes: body.notes,
      metadata: body.metadata || body.item || {},
    });

    const saved = await saveIntelligence(userId, {
      entityType: validated.entity_type,
      entityId: validated.entity_id,
      title: validated.title,
      notes: validated.notes,
      metadata: validated.metadata,
    });

    return NextResponse.json({ ok: true, saved });
  } catch (err: any) {
    logger.error('Failed to save intelligence item', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const { searchParams } = new URL(request.url);
    let itemId = searchParams.get('itemId');
    let entityType = searchParams.get('type') as SavedEntityType;
    let entityId = searchParams.get('id');

    if (!itemId && !entityType) {
      try {
        const body = await request.json();
        itemId = body.itemId || body.item_id;
        entityType = (body.type || body.entityType || body.entity_type) as SavedEntityType;
        entityId = body.id || body.entityId || body.entity_id;
      } catch {}
    }

    if (itemId) {
      await removeBookmark(userId, itemId);
      try {
        await unsaveIntelligence(userId, 'item', itemId);
      } catch {}
      return NextResponse.json({ ok: true, removed: { itemId } });
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { ok: false, error: 'type and id parameters (or itemId) are required' },
        { status: 400 }
      );
    }

    await unsaveIntelligence(userId, entityType, entityId);
    return NextResponse.json({ ok: true, removed: { entityType, entityId } });
  } catch (err: any) {
    logger.error('Failed to unsave intelligence item', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
