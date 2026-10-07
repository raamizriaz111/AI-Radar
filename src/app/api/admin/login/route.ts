// =============================================================================
// AI Radar — Admin Login API Route
// POST /api/admin/login
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPasskey, setAdminSessionCookie } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const passkey = body.passkey || body.password || '';

    if (!verifyAdminPasskey(passkey)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid admin credentials. Access denied.' },
        { status: 401 }
      );
    }

    await setAdminSessionCookie();

    return NextResponse.json({
      ok: true,
      message: 'Admin authorization granted',
      role: 'admin',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
