// =============================================================================
// AI Radar — Promo / Discount Coupon API Route
// GET, POST /api/billing/coupon
// =============================================================================
// Validates promo codes against tiers. Strictly enforces:
// - Pro tier: 'RaamizPro'
// - Advanced tier: 'RaamizAdv'
// - All other codes return 400 with 'Invalid code'
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/billing/couponConfig';
import type { PlanSlug } from '@/lib/billing/planConfig';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body.code || body.promoCode || body.couponCode;
    const planSlug = body.planSlug as PlanSlug | undefined;

    const result = validateCoupon(code, planSlug);

    if (!result.valid) {
      return NextResponse.json(
        { ok: false, valid: false, error: result.error || 'Invalid code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      coupon: result.coupon,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, valid: false, error: err?.message || 'Invalid code' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || searchParams.get('promoCode');
    const planSlug = searchParams.get('planSlug') as PlanSlug | null;

    const result = validateCoupon(code, planSlug || undefined);

    if (!result.valid) {
      return NextResponse.json(
        { ok: false, valid: false, error: result.error || 'Invalid code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      coupon: result.coupon,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, valid: false, error: err?.message || 'Invalid code' },
      { status: 400 }
    );
  }
}
