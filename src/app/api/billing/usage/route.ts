// =============================================================================
// API: GET /api/billing/usage — Returns current usage period for a user
// =============================================================================
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentUsagePeriod } from '@/lib/billing/usageEnforcement';
import { getSubscription } from '@/lib/billing/subscriptionService';
import { getPlanConfig } from '@/lib/billing/planConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const [subscription, usagePeriod] = await Promise.all([
      getSubscription(user.id),
      getCurrentUsagePeriod(user.id),
    ]);

    const plan = getPlanConfig(subscription.planSlug);

    return NextResponse.json({
      subscription: {
        planSlug: subscription.planSlug,
        status: subscription.status,
        planDisplayName: plan.displayName,
      },
      usagePeriod,
      limits: plan.limits,
    });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load usage data' }, { status: 500 });
  }
}
