// =============================================================================
// API: POST /api/billing/cancel — Cancels current subscription at period end
// =============================================================================
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { cancelSubscription, getSubscription } from '@/lib/billing/subscriptionService';
import { getBillingProvider } from '@/lib/billing';
import { logger } from '@/lib/services/logger';

export async function POST() {
  try {
    const user = await requireAuth();
    const sub = await getSubscription(user.id);

    // If linked to a payment provider, cancel there first
    if (sub.providerSubscriptionId && sub.provider === 'stripe') {
      try {
        const provider = getBillingProvider();
        await provider.cancelSubscription(sub.providerSubscriptionId);
      } catch (err) {
        logger.warn('Provider cancellation failed, proceeding with local cancellation', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const updated = await cancelSubscription(user.id);
    logger.info('Subscription canceled', { userId: user.id, planSlug: sub.planSlug });

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: 'Your subscription will remain active until the end of your current billing period.',
    });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
