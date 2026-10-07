// =============================================================================
// AI Radar — User Preferences API Route (Phase 5)
// GET /api/preferences & POST /api/preferences
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserPreferences, saveUserPreferences } from '@/lib/intelligence/preferences';
import { UserPreferencesSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const preferences = await getUserPreferences();
    return NextResponse.json({ ok: true, preferences });
  } catch (err: any) {
    logger.error('Failed to get preferences', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = UserPreferencesSchema.parse(body);

    const success = await saveUserPreferences({
      topics: validated.topics,
      categories: validated.categories as any,
      interestLevel: (validated.interestLevel || validated.interest_level) as any,
    });

    if (!success) {
      return NextResponse.json({ ok: false, error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, preferences: validated });
  } catch (err: any) {
    logger.error('Failed to update preferences', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
