// =============================================================================
// API: GET, POST /api/billing/subscription — Returns or switches user's subscription
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getSubscription, changePlan } from '@/lib/billing/subscriptionService';
import { getCurrentUsagePeriod } from '@/lib/billing/usageEnforcement';
import { getUserInvoices } from '@/lib/billing/invoiceService';
import { getPlanConfig, getPlanLimits, isValidPlanSlug, PlanSlug } from '@/lib/billing/planConfig';
import { validateCoupon } from '@/lib/billing/couponConfig';
import { updateUserPlan } from '@/lib/services/usageService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'default';

    const [subscription, usagePeriod, recentInvoices] = await Promise.all([
      getSubscription(userId),
      getCurrentUsagePeriod(userId),
      getUserInvoices(userId, 5),
    ]);

    const plan = getPlanConfig(subscription.planSlug);
    const isDev = process.env.NODE_ENV !== 'production';
    const isAdmin = user?.role === 'admin';
    const canUseTestMode = isDev || isAdmin;

    return NextResponse.json({
      subscription,
      plan,
      usagePeriod,
      recentInvoices,
      isGuest: !user,
      userId,
      isDev,
      isAdmin,
      canUseTestMode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'default';
    const body = await req.json();
    const planSlug = body.planSlug as PlanSlug;
    const billingInterval = body.billingInterval || 'monthly';
    const promoCode = body.promoCode || body.couponCode;

    if (!planSlug || !isValidPlanSlug(planSlug)) {
      return NextResponse.json(
        { error: 'Invalid plan slug. Must be "free", "pro", or "advanced".' },
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const isAdmin = user?.role === 'admin';
    const canUseTestMode = isDev || isAdmin;

    // Validate promo code if provided
    let validatedPromo = null;
    if (promoCode) {
      const couponResult = validateCoupon(promoCode, planSlug);
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error || 'Invalid code' },
          { status: 400 }
        );
      }
      validatedPromo = couponResult.coupon;
    }

    // In production, public visitors / non-admin accounts cannot switch to paid tiers without Lemon Squeezy checkout OR a valid promo code.
    if (planSlug !== 'free' && !canUseTestMode && !validatedPromo) {
      return NextResponse.json(
        {
          error: 'Paid subscriptions must be completed through Lemon Squeezy checkout.',
          requiresCheckout: true,
        },
        { status: 403 }
      );
    }

    const updatedSub = await changePlan(userId, planSlug, billingInterval);
    if (validatedPromo) {
      updatedSub.metadata = {
        ...updatedSub.metadata,
        promoCode: validatedPromo.code,
        discountPercent: validatedPromo.discountPercent,
      };
    }
    const plan = getPlanConfig(planSlug);
    const limits = getPlanLimits(planSlug);

    // Keep legacy / settings usage in sync
    try {
      await updateUserPlan(userId, {
        planTier: planSlug as any,
        aiRequestsLimit: limits.aiRequestsLimit,
        briefingsLimit: limits.briefingsLimit,
        trackedTopicsLimit: limits.trackedTopicsLimit,
        features: plan.features as any,
      });
    } catch {}

    const usagePeriod = await getCurrentUsagePeriod(userId);

    return NextResponse.json({
      ok: true,
      subscription: updatedSub,
      plan,
      usagePeriod,
      isGuest: !user,
      userId,
      isDev,
      isAdmin,
      canUseTestMode,
      message: `Active tier changed to ${plan.displayName} plan successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update plan' },
      { status: 500 }
    );
  }
}

