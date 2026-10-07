// =============================================================================
// AI Radar — Admin Telemetry & Distribution API Route
// GET /api/admin/telemetry
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth/adminAuth';
import { getAdminTelemetry } from '@/lib/services/adminTelemetryService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const isAuth = await isAdminAuthenticated();
  const host = request.headers.get('host');
  const isLocal = host?.includes('localhost') || host?.includes('127.0.0.1');

  if (!isAuth && !isLocal && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Admin authorization required' },
      { status: 401 }
    );
  }

  try {
    const telemetry = await getAdminTelemetry();
    return NextResponse.json({ ok: true, telemetry });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to generate telemetry' },
      { status: 500 }
    );
  }
}
