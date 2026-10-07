// =============================================================================
// AI Radar — Admin Logout API Route
// POST /api/admin/logout
// =============================================================================

import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true, message: 'Admin session terminated' });
}
