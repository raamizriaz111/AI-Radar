// =============================================================================
// API: POST /api/billing/portal — Creates a billing portal session
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getBillingProvider } from '@/lib/billing';
import { logger } from '@/lib/services/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const returnUrl = (body as { returnUrl?: string }).returnUrl
      ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pricing`;

    const provider = getBillingProvider();

    // In mock mode, generate a mock customer ID from the userId
    const customerId = `cus_${user.id.replace(/-/g, '').slice(0, 12)}`;

    const portal = await provider.createBillingPortal({
      userId: user.id,
      customerId,
      returnUrl,
    });

    logger.info('Billing portal session created', { userId: user.id, provider: provider.id });

    return NextResponse.json({ portalUrl: portal.portalUrl });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}
