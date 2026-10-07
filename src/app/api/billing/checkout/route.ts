// =============================================================================
// API: POST /api/billing/checkout — Creates a checkout session
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import { getBillingProvider } from '@/lib/billing';
import { isValidPlanSlug, PlanSlug } from '@/lib/billing/planConfig';
import { validateCoupon } from '@/lib/billing/couponConfig';
import { logger } from '@/lib/services/logger';

const CheckoutBodySchema = z.object({
  planSlug: z.string(),
  billingInterval: z.enum(['monthly', 'annual']).default('monthly'),
  promoCode: z.string().optional(),
  couponCode: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = CheckoutBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { planSlug, billingInterval, successUrl, cancelUrl } = parsed.data;
    const rawPromo = parsed.data.promoCode || parsed.data.couponCode;

    if (!isValidPlanSlug(planSlug) || planSlug === 'free') {
      return NextResponse.json(
        { error: 'Invalid plan. Free plan does not require checkout.' },
        { status: 400 }
      );
    }

    let appliedDiscountCode: string | undefined = undefined;
    if (rawPromo) {
      const couponResult = validateCoupon(rawPromo, planSlug as PlanSlug);
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error || 'Invalid code' },
          { status: 400 }
        );
      }
      appliedDiscountCode = couponResult.coupon?.code;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const provider = getBillingProvider();

    const session = await provider.createCheckoutSession({
      userId: user.id,
      userEmail: user.email ?? '',
      planSlug,
      billingInterval,
      discountCode: appliedDiscountCode,
      successUrl: successUrl ?? `${appUrl}/account/billing?success=true`,
      cancelUrl: cancelUrl ?? `${appUrl}/pricing?canceled=true`,
    });

    logger.info('Checkout session created', { userId: user.id, planSlug, provider: provider.id });

    return NextResponse.json({ checkoutUrl: session.checkoutUrl, sessionId: session.sessionId });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    logger.error('Checkout session creation failed', err instanceof Error ? { error: err.message } : undefined);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
