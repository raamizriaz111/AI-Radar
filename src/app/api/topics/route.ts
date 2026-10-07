// =============================================================================
// AI Radar — User Tracked Topics API Route (Phase 7 Section 17)
// GET, POST, DELETE /api/topics
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getUserTrackedTopics,
  addTrackedTopic,
  removeTrackedTopic,
} from '@/lib/repositories/personalizationRepository';
import { TrackedTopicSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const topics = await getUserTrackedTopics(userId);
    return NextResponse.json({ ok: true, topics });
  } catch (err: any) {
    logger.error('Failed to get tracked topics', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const body = await request.json();
    const validated = TrackedTopicSchema.parse(body);

    const added = await addTrackedTopic(userId, validated.topic, validated.category);
    return NextResponse.json({ ok: true, topic: added });
  } catch (err: any) {
    logger.error('Failed to add tracked topic', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    if (!topic) {
      return NextResponse.json({ ok: false, error: 'Topic parameter is required' }, { status: 400 });
    }

    await removeTrackedTopic(userId, topic);
    return NextResponse.json({ ok: true, removed: topic });
  } catch (err: any) {
    logger.error('Failed to remove tracked topic', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
