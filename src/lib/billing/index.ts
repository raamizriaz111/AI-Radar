// =============================================================================
// AI Radar — Phase 8: Billing Provider Registry
// =============================================================================
// Returns the active billing provider based on environment configuration.
// =============================================================================

import type { IBillingProvider } from './billingProvider';
import { mockBillingProvider } from './mockProvider';
import { stripeBillingProvider } from './stripeProvider';
import { lemonSqueezyBillingProvider } from './lemonSqueezyProvider';

/**
 * Returns the active billing provider.
 * Priority:
 * 1. Lemon Squeezy (when LEMONSQUEEZY_API_KEY & STORE_ID are configured)
 * 2. Stripe (when STRIPE_SECRET_KEY is configured)
 * 3. MockBillingProvider (development / testing fallback)
 */
export function getBillingProvider(): IBillingProvider {
  if (lemonSqueezyBillingProvider.isConfigured) {
    return lemonSqueezyBillingProvider;
  }
  if (stripeBillingProvider.isConfigured) {
    return stripeBillingProvider;
  }
  return mockBillingProvider;
}

export type { IBillingProvider };
