// =============================================================================
// AI Radar — Phase 8: Feature Access Control
// =============================================================================
// Server-side feature gating — never trust client-submitted plan claims.
// All feature access checks go through this service.
// =============================================================================

import type { FeatureAccessResult } from './types';
import type { PlanSlug } from './planConfig';
import { getPlanConfig, getPlanFeatures, type PlanFeatures } from './planConfig';
import { getSubscription } from './subscriptionService';

/**
 * Returns the active plan slug for a user.
 * Reads from the subscription service — never from client input.
 */
export async function getActivePlanSlug(userId: string): Promise<PlanSlug> {
  const sub = await getSubscription(userId);
  // Only active/trialing subscriptions confer plan benefits
  if (sub.status === 'active' || sub.status === 'trialing') {
    return sub.planSlug;
  }
  // Expired/canceled users revert to free
  return 'free';
}

/**
 * Checks if a user has access to a named feature.
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<FeatureAccessResult> {
  const planSlug = await getActivePlanSlug(userId);
  const features = getPlanFeatures(planSlug);

  if (features[feature]) {
    return { allowed: true, planSlug };
  }

  // Determine which plan first unlocks the feature
  const upgradeRequired = findUpgradePlanForFeature(planSlug, feature);

  return {
    allowed: false,
    planSlug,
    reason: `Your ${getPlanConfig(planSlug).displayName} plan does not include ${featureLabel(feature)}.`,
    upgradeRequired: upgradeRequired ?? undefined,
  };
}

/**
 * Synchronous version for use in components where async is not available.
 * Accepts the plan slug directly — caller must resolve it first.
 */
export function checkFeatureAccessSync(
  planSlug: PlanSlug,
  feature: keyof PlanFeatures
): FeatureAccessResult {
  const features = getPlanFeatures(planSlug);

  if (features[feature]) {
    return { allowed: true, planSlug };
  }

  const upgradeRequired = findUpgradePlanForFeature(planSlug, feature);

  return {
    allowed: false,
    planSlug,
    reason: `Your ${getPlanConfig(planSlug).displayName} plan does not include ${featureLabel(feature)}.`,
    upgradeRequired: upgradeRequired ?? undefined,
  };
}

/**
 * Checks multiple features at once.
 */
export async function checkMultipleFeatures(
  userId: string,
  features: Array<keyof PlanFeatures>
): Promise<Record<string, FeatureAccessResult>> {
  const planSlug = await getActivePlanSlug(userId);
  const result: Record<string, FeatureAccessResult> = {};

  for (const feature of features) {
    result[feature] = checkFeatureAccessSync(planSlug, feature);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_ORDER: PlanSlug[] = ['free', 'pro', 'advanced'];

function findUpgradePlanForFeature(
  currentSlug: PlanSlug,
  feature: keyof PlanFeatures
): PlanSlug | null {
  const currentIdx = PLAN_ORDER.indexOf(currentSlug);
  for (let i = currentIdx + 1; i < PLAN_ORDER.length; i++) {
    const candidate = PLAN_ORDER[i];
    if (getPlanFeatures(candidate)[feature]) {
      return candidate;
    }
  }
  return null;
}

function featureLabel(feature: keyof PlanFeatures): string {
  const labels: Record<keyof PlanFeatures, string> = {
    customTopics: 'custom topic tracking',
    export: 'data export',
    earlyTrends: 'early trend signals',
    advancedFilters: 'advanced filters',
    apiAccess: 'API access',
    prioritySupport: 'priority support',
    emailDigest: 'morning email digest',
    breakingAlerts: 'breaking news alerts',
    webhookAlerts: 'webhook and Telegram delivery',
    codeBlueprints: 'technical code blueprints',
  };
  return labels[feature] ?? feature;
}
