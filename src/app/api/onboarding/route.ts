// =============================================================================
// AI Radar — User Onboarding API Route (Phase 7 Section 7 & 8)
// POST /api/onboarding
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { OnboardingSchema } from '@/lib/validation/schemas';
import {
  getUserProfile,
  saveUserProfile,
  addTrackedTopic,
} from '@/lib/repositories/personalizationRepository';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    const body = await request.json();
    const validated = OnboardingSchema.parse(body);

    const currentProfile = await getUserProfile(userId);

    // If user skipped onboarding, mark metadata as skipped and keep current profile
    if (validated.skipped) {
      const updated = await saveUserProfile(
        {
          ...currentProfile,
          metadata: {
            ...currentProfile.metadata,
            onboardingCompleted: true,
            onboardingSkipped: true,
          },
        },
        userId
      );
      return NextResponse.json({ ok: true, profile: updated, skipped: true });
    }

    // Assemble updated profile
    const updated = await saveUserProfile(
      {
        name: validated.name || currentProfile.name,
        experienceLevel: validated.experience_level || currentProfile.experienceLevel,
        primaryRoleInterest:
          validated.career_interests && validated.career_interests.length > 0
            ? validated.career_interests[0]
            : currentProfile.primaryRoleInterest,
        secondaryRoleInterests:
          validated.career_interests && validated.career_interests.length > 1
            ? validated.career_interests.slice(1)
            : currentProfile.secondaryRoleInterests,
        technologies:
          validated.technologies && validated.technologies.length > 0
            ? validated.technologies
            : currentProfile.technologies,
        learningGoals:
          validated.learning_goals && validated.learning_goals.length > 0
            ? validated.learning_goals
            : currentProfile.learningGoals,
        projectInterests:
          validated.project_interests && validated.project_interests.length > 0
            ? validated.project_interests
            : currentProfile.projectInterests,
        preferredTopics:
          validated.interests && validated.interests.length > 0
            ? validated.interests
            : currentProfile.preferredTopics,
        metadata: {
          ...currentProfile.metadata,
          onboardingCompleted: true,
          preferredCategories: validated.preferred_categories,
        },
      },
      userId
    );

    // Automatically add selected top interests to user tracked topics
    if (userId && validated.interests && validated.interests.length > 0) {
      for (const interest of validated.interests.slice(0, 5)) {
        await addTrackedTopic(userId, interest, 'onboarding_interest');
      }
    }

    return NextResponse.json({ ok: true, profile: updated, skipped: false });
  } catch (err: any) {
    logger.error('Onboarding error', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to complete onboarding' },
      { status: 400 }
    );
  }
}
