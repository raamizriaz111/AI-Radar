// =============================================================================
// AI Radar — User Intelligence Feedback API Route (Phase 7 Multi-User)
// GET, POST /api/feedback
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  recordUserFeedback,
  getUserFeedbackList,
} from '@/lib/repositories/personalizationRepository';
import { CreateUserFeedbackSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const list = await getUserFeedbackList(user?.id);
    return NextResponse.json({ ok: true, feedback: list });
  } catch (err: any) {
    logger.error('Failed to get user feedback', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const validated = CreateUserFeedbackSchema.parse(body);

    // Enforce authenticated ownership: never allow client to spoof another user ID
    const effectiveUserId = user?.id || validated.user_id || null;

    await recordUserFeedback({
      userId: effectiveUserId,
      entityType: validated.entity_type,
      entityId: validated.entity_id,
      feedbackType: validated.feedback_type,
      notes: validated.notes,
    });

    return NextResponse.json({ ok: true, userId: effectiveUserId });
  } catch (err: any) {
    logger.error('Failed to record user feedback', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
