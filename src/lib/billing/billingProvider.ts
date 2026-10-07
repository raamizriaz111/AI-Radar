// =============================================================================
// AI Radar — Phase 8: Billing Provider Interface
// =============================================================================
// Provider-agnostic interface for payment operations.
// Implementations: StripeProvider, MockBillingProvider
// =============================================================================

import type {
  CheckoutSessionResult,
  BillingPortalResult,
  Subscription,
} from './types';
import type { PlanSlug, BillingInterval } from './planConfig';

export interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  planSlug: PlanSlug;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
  existingCustomerId?: string;
  discountCode?: string;
}

export interface CreatePortalParams {
  userId: string;
  customerId: string;
  returnUrl: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  provider: string;
}

export interface ParsedWebhookResult {
  event: WebhookEvent;
  rawPayload: Record<string, unknown>;
}

/**
 * Provider-agnostic billing interface.
 * All payment operations go through this abstraction —
 * switching providers requires only a new implementation.
 */
export interface IBillingProvider {
  readonly id: string;
  readonly displayName: string;
  readonly isConfigured: boolean;

  /**
   * Creates a checkout session for upgrading to a paid plan.
   */
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;

  /**
   * Creates a billing portal session for subscription management.
   */
  createBillingPortal(params: CreatePortalParams): Promise<BillingPortalResult>;

  /**
   * Verifies and parses an incoming webhook payload.
   * Throws if the signature is invalid.
   */
  parseWebhook(payload: string, signature: string): ParsedWebhookResult;

  /**
   * Creates or retrieves a customer record for the given user.
   */
  ensureCustomer(userId: string, email: string): Promise<string>;

  /**
   * Cancels a subscription at period end.
   */
  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  /**
   * Resumes a canceled subscription (before period end).
   */
  resumeSubscription(providerSubscriptionId: string): Promise<void>;
}
