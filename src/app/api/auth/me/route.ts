// =============================================================================
// AI Radar — Auth Me API Route (Phase 7)
// GET /api/auth/me
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserProfile, getUserTrackedTopics } from '@/lib/repositories/personalizationRepository';
import { getUserPlan } from '@/lib/services/usageService';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: true, user: null, authenticated: false });
  }

  const [profile, plan, trackedTopics] = await Promise.all([
    getUserProfile(user.id),
    getUserPlan(user.id),
    getUserTrackedTopics(user.id),
  ]);

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: profile?.name || user.name || user.email?.split('@')[0],
      role: user.role,
    },
    profile,
    plan,
    trackedTopics,
  });
}
