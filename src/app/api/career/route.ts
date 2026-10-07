// =============================================================================
// AI Radar — Career Signals & Skill Gaps API Route (Phase 7 Multi-User)
// GET /api/career & PATCH /api/career
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getCareerSignals,
  getSkillGaps,
  updateSkillGapStatus,
  getUserProfile,
} from '@/lib/repositories/personalizationRepository';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const profile = await getUserProfile(user?.id);
    const [signals, skillGaps] = await Promise.all([
      getCareerSignals(),
      getSkillGaps(profile, user?.id),
    ]);

    return NextResponse.json({
      ok: true,
      profile,
      signals,
      skillGaps,
    });
  } catch (err: any) {
    logger.error('Failed to get career intelligence', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { gapId, status } = body;

    if (!gapId || !status) {
      return NextResponse.json({ ok: false, error: 'gapId and status are required' }, { status: 400 });
    }

    await updateSkillGapStatus(gapId, status, user?.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error('Failed to update skill gap status', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
