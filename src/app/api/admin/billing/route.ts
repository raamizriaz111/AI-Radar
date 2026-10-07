// =============================================================================
// API: GET /api/admin/billing — Admin billing dashboard stats
// =============================================================================
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getBillingAdminSummary } from '@/lib/billing/subscriptionService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const summary = getBillingAdminSummary();
    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (err instanceof Error && (err as any).status === 403) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to load admin billing data' }, { status: 500 });
  }
}
