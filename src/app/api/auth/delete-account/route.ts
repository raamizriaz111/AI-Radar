// =============================================================================
// AI Radar — Account Deletion API Route (Phase 7 Section 31)
// POST /api/auth/delete-account
// =============================================================================

import { NextResponse } from 'next/server';
import { requireAuth, clearMockSession } from '@/lib/auth/session';
import { deleteUserData } from '@/lib/repositories/personalizationRepository';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    logger.info('Received account deletion request', { userId: user.id });

    // 1. Delete all user-owned domain data (profiles, bookmarks, feedback, topics, plans, logs)
    const deletionResult = await deleteUserData(user.id);

    // 2. Delete Supabase Auth account if service role is available
    if (isDatabaseConfigured() && isServiceKeyConfigured()) {
      try {
        const serviceClient = createServiceClient();
        await serviceClient.auth.admin.deleteUser(user.id);
      } catch (authErr) {
        logger.error('Failed to delete auth user from Supabase admin', authErr);
      }
    }

    // 3. Clear session
    clearMockSession();
    if (isDatabaseConfigured()) {
      try {
        const client = await createClient();
        await client.auth.signOut();
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      message: 'Account and associated personal data deleted successfully.',
      result: deletionResult,
    });
  } catch (err: any) {
    if (err.status === 401) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error during account deletion', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
