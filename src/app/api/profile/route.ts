// =============================================================================
// AI Radar — User Profile API Route (Phase 7 Multi-User)
// GET /api/profile & POST /api/profile
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserProfile, saveUserProfile } from '@/lib/repositories/personalizationRepository';
import { UserProfileSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const profile = await getUserProfile(user?.id);
    return NextResponse.json({ ok: true, profile, authenticated: Boolean(user) });
  } catch (err: any) {
    logger.error('Failed to get user profile', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    const body = await request.json();
    const validated = UserProfileSchema.partial().parse(body);

    const updated = await saveUserProfile(
      {
        name: validated.name,
        experienceLevel: validated.experience_level,
        primaryRoleInterest: validated.primary_role_interest,
        secondaryRoleInterests: validated.secondary_role_interests,
        skills: validated.skills as any,
        technologies: validated.technologies,
        careerGoals: validated.career_goals,
        learningGoals: validated.learning_goals,
        projectInterests: validated.project_interests,
        preferredTopics: validated.preferred_topics,
        excludedTopics: validated.excluded_topics,
        metadata: validated.metadata,
      },
      userId
    );

    return NextResponse.json({ ok: true, profile: updated });
  } catch (err: any) {
    logger.error('Failed to save user profile', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
