// =============================================================================
// API: GET /api/billing/invoices — Returns invoice history for a user
// =============================================================================
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getUserInvoices } from '@/lib/billing/invoiceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const invoices = await getUserInvoices(user.id, 24);
    return NextResponse.json({ invoices });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
  }
}
