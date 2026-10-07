// =============================================================================
// AI Radar — Phase 8: Plan Configuration
// =============================================================================
// Central, configurable plan definitions. Limits and features are read from
// this module — never hard-coded in service logic. Changing a plan limit here
// propagates everywhere without code changes.
// =============================================================================

export type PlanSlug = 'free' | 'pro' | 'advanced';
export type BillingInterval = 'monthly' | 'annual' | 'none';

export interface PlanFeatures {
  customTopics: boolean;
  export: boolean;
  earlyTrends: boolean;
  advancedFilters: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  emailDigest: boolean;
  breakingAlerts: boolean;
  webhookAlerts: boolean;
  codeBlueprints: boolean;
}

export interface PlanLimits {
  aiRequestsLimit: number;
  briefingsLimit: number;
  trackedTopicsLimit: number;
  itemsPerPageLimit: number;
}

export interface PlanConfig {
  slug: PlanSlug;
  displayName: string;
  description: string;
  priceMonthlyUsd: number;
  priceAnnualUsd: number | null;
  limits: PlanLimits;
  features: PlanFeatures;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  lemonSqueezyVariantIdMonthly?: string;
  lemonSqueezyVariantIdAnnual?: string;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Canonical plan definitions — edit here to change product behaviour
// ---------------------------------------------------------------------------

export const PLAN_CONFIGS: Record<PlanSlug, PlanConfig> = {
  free: {
    slug: 'free',
    displayName: 'Free',
    description: 'Full manual access to AI intelligence feeds. On-demand web briefings. No automated email alerts.',
    priceMonthlyUsd: 0,
    priceAnnualUsd: null,
    limits: {
      aiRequestsLimit: 100,
      briefingsLimit: 10,
      trackedTopicsLimit: 20,
      itemsPerPageLimit: 20,
    },
    features: {
      customTopics: true,
      export: false,
      earlyTrends: true,
      advancedFilters: false,
      apiAccess: false,
      prioritySupport: false,
      emailDigest: false,
      breakingAlerts: false,
      webhookAlerts: false,
      codeBlueprints: false,
    },
    sortOrder: 0,
  },

  pro: {
    slug: 'pro',
    displayName: 'Pro',
    description: 'Daily 7:00 AM executive email digest, breaking model alerts, custom keyword triggers, and technical blueprints.',
    priceMonthlyUsd: 10,
    priceAnnualUsd: 100,
    limits: {
      aiRequestsLimit: 1000,
      briefingsLimit: 30,
      trackedTopicsLimit: 100,
      itemsPerPageLimit: 50,
    },
    features: {
      customTopics: true,
      export: true,
      earlyTrends: true,
      advancedFilters: true,
      apiAccess: false,
      prioritySupport: false,
      emailDigest: true,
      breakingAlerts: true,
      webhookAlerts: false,
      codeBlueprints: true,
    },
    stripePriceIdMonthly: process.env.STRIPE_PRO_PRICE_ID_MONTHLY || undefined,
    stripePriceIdAnnual: process.env.STRIPE_PRO_PRICE_ID_ANNUAL || undefined,
    lemonSqueezyVariantIdMonthly: process.env.LEMONSQUEEZY_PRO_VARIANT_ID_MONTHLY || undefined,
    lemonSqueezyVariantIdAnnual: process.env.LEMONSQUEEZY_PRO_VARIANT_ID_ANNUAL || undefined,
    sortOrder: 1,
  },

  advanced: {
    slug: 'advanced',
    displayName: 'Advanced',
    description: 'High-frequency radar with hourly delivery, multi-channel Telegram/Webhook alerts, 100 targets, and personal API tokens.',
    priceMonthlyUsd: 20,
    priceAnnualUsd: 200,
    limits: {
      aiRequestsLimit: 10000,
      briefingsLimit: 100,
      trackedTopicsLimit: 500,
      itemsPerPageLimit: 100,
    },
    features: {
      customTopics: true,
      export: true,
      earlyTrends: true,
      advancedFilters: true,
      apiAccess: true,
      prioritySupport: true,
      emailDigest: true,
      breakingAlerts: true,
      webhookAlerts: true,
      codeBlueprints: true,
    },
    stripePriceIdMonthly: process.env.STRIPE_ADVANCED_PRICE_ID_MONTHLY || undefined,
    stripePriceIdAnnual: process.env.STRIPE_ADVANCED_PRICE_ID_ANNUAL || undefined,
    lemonSqueezyVariantIdMonthly: process.env.LEMONSQUEEZY_ADVANCED_VARIANT_ID_MONTHLY || undefined,
    lemonSqueezyVariantIdAnnual: process.env.LEMONSQUEEZY_ADVANCED_VARIANT_ID_ANNUAL || undefined,
    sortOrder: 2,
  },
};

/**
 * Returns the plan configuration for a given slug.
 * Defaults to 'free' if not found.
 */
export function getPlanConfig(slug: string): PlanConfig {
  return PLAN_CONFIGS[slug as PlanSlug] ?? PLAN_CONFIGS.free;
}

/**
 * Returns all plans sorted by sort_order, optionally filtered to paid only.
 */
export function getAllPlans(options?: { paidOnly?: boolean }): PlanConfig[] {
  const plans = Object.values(PLAN_CONFIGS).sort((a, b) => a.sortOrder - b.sortOrder);
  if (options?.paidOnly) {
    return plans.filter((p) => p.priceMonthlyUsd > 0);
  }
  return plans;
}

/**
 * Checks if a plan slug is valid.
 */
export function isValidPlanSlug(slug: string): slug is PlanSlug {
  return slug in PLAN_CONFIGS;
}

/**
 * Returns the limits for a plan slug (defaults to free).
 */
export function getPlanLimits(slug: string): PlanLimits {
  return getPlanConfig(slug).limits;
}

/**
 * Returns the features for a plan slug (defaults to free).
 */
export function getPlanFeatures(slug: string): PlanFeatures {
  return getPlanConfig(slug).features;
}
