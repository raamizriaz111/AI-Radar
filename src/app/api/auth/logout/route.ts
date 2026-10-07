// =============================================================================
// AI Radar — Auth Sign Out API Route (Phase 7)
// POST /api/auth/logout
// =============================================================================

import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { clearMockSession } from '@/lib/auth/session';
import { clearAppSessionCookie } from '@/lib/auth/sessionCookie';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    clearMockSession();
    await clearAppSessionCookie();

    if (isDatabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error('Logout error', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
