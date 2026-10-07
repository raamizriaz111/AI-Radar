// =============================================================================
// AI Radar — Phase 8: Mock Billing Provider
// =============================================================================
// Used in test mode and when STRIPE_SECRET_KEY is not configured.
// Implements the full IBillingProvider interface with predictable in-memory state.
// =============================================================================

import type { IBillingProvider, CreateCheckoutParams, CreatePortalParams, ParsedWebhookResult } from './billingProvider';
import type { CheckoutSessionResult, BillingPortalResult } from './types';

export class MockBillingProvider implements IBillingProvider {
  readonly id = 'mock';
  readonly displayName = 'Mock Billing (Dev Mode)';
  readonly isConfigured = true;

  // In-memory state for tests
  private readonly customers: Map<string, string> = new Map(); // userId -> customerId
  private customerCounter = 0;

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const sessionId = `mock_session_${params.userId}_${params.planSlug}_${Date.now()}`;
    const separator = params.successUrl.includes('?') ? '&' : '?';
    return {
      sessionId,
      checkoutUrl: `${params.successUrl}${separator}session_id=${sessionId}&mock=true`,
      provider: this.id,
    };
  }

  async createBillingPortal(params: CreatePortalParams): Promise<BillingPortalResult> {
    return {
      portalUrl: `${params.returnUrl}?portal=true&customer=${params.customerId}&mock=true`,
      provider: this.id,
    };
  }

  parseWebhook(payload: string, _signature: string): ParsedWebhookResult {
    const data = JSON.parse(payload) as Record<string, unknown>;
    return {
      event: {
        id: (data['id'] as string) ?? `mock_evt_${Date.now()}`,
        type: (data['type'] as string) ?? 'mock.event',
        data: (data['data'] as Record<string, unknown>) ?? {},
        provider: this.id,
      },
      rawPayload: data,
    };
  }

  async ensureCustomer(userId: string, email: string): Promise<string> {
    const existing = this.customers.get(userId);
    if (existing) return existing;
    const customerId = `mock_cus_${++this.customerCounter}_${userId.slice(0, 8)}`;
    this.customers.set(userId, customerId);
    return customerId;
  }

  async cancelSubscription(_providerSubscriptionId: string): Promise<void> {
    // No-op in mock
  }

  async resumeSubscription(_providerSubscriptionId: string): Promise<void> {
    // No-op in mock
  }

  /** Reset internal state between tests */
  reset(): void {
    this.customers.clear();
    this.customerCounter = 0;
  }
}

export const mockBillingProvider = new MockBillingProvider();
