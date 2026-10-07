// =============================================================================
// AI Radar — Project Opportunities API Route (Phase 7 Multi-User)
// GET /api/projects & PATCH /api/projects
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getProjectOpportunities,
  updateProjectOpportunityStatus,
  getUserProfile,
} from '@/lib/repositories/personalizationRepository';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const profile = await getUserProfile(user?.id);
    const opportunities = await getProjectOpportunities(profile, user?.id);

    return NextResponse.json({
      ok: true,
      opportunities,
    });
  } catch (err: any) {
    logger.error('Failed to get project opportunities', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { slug, status, userNotes } = body;

    if (!slug || !status) {
      return NextResponse.json({ ok: false, error: 'slug and status are required' }, { status: 400 });
    }

    await updateProjectOpportunityStatus(slug, status, userNotes, user?.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error('Failed to update project opportunity', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
