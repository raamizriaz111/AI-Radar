// =============================================================================
// AI Radar — Promo & Discount Coupon Engine
// =============================================================================
// Dedicated promotional coupon validation engine for Pro and Advanced tiers.
// STRICT ENFORCEMENT: Only accepts 'RaamizPro' (Pro) and 'RaamizAdv' (Advanced).
// Any other code returns 'Invalid code'.
// =============================================================================

import type { PlanSlug } from './planConfig';

export interface CouponDefinition {
  code: string;
  planSlug: PlanSlug;
  discountPercent: number;
  displayName: string;
  description: string;
}

export const VALID_COUPONS: Record<string, CouponDefinition> = {
  raamizpro: {
    code: 'RaamizPro',
    planSlug: 'pro',
    discountPercent: 100,
    displayName: 'VIP Pro Pass',
    description: '100% off Pro Tier intelligence feeds and daily executive digests.',
  },
  raamizadv: {
    code: 'RaamizAdv',
    planSlug: 'advanced',
    discountPercent: 100,
    displayName: 'VIP Advanced Pass',
    description: '100% off Advanced Tier with programmatic API access, blueprints, and real-time alerts.',
  },
};

export interface CouponValidationResult {
  valid: boolean;
  coupon?: CouponDefinition;
  error?: string;
}

/**
 * Validates a discount coupon code against the requested tier.
 * STRICT ENFORCEMENT:
 * - 'RaamizPro' is valid ONLY for the 'pro' tier.
 * - 'RaamizAdv' is valid ONLY for the 'advanced' tier.
 * - Any other code or mismatched tier returns 'Invalid code'.
 */
export function validateCoupon(
  rawCode?: string | null,
  targetPlan?: PlanSlug
): CouponValidationResult {
  if (!rawCode || typeof rawCode !== 'string') {
    return { valid: false, error: 'Invalid code' };
  }

  const normalized = rawCode.trim().toLowerCase();
  const coupon = VALID_COUPONS[normalized];

  if (!coupon) {
    return { valid: false, error: 'Invalid code' };
  }

  // If a specific target plan is requested, verify strict tier match
  if (targetPlan && coupon.planSlug !== targetPlan) {
    return { valid: false, error: 'Invalid code' };
  }

  return {
    valid: true,
    coupon,
  };
}

/**
 * Checks whether a raw code matches any known promo coupon.
 */
export function isValidCouponCode(rawCode?: string | null): boolean {
  if (!rawCode || typeof rawCode !== 'string') return false;
  return Boolean(VALID_COUPONS[rawCode.trim().toLowerCase()]);
}
