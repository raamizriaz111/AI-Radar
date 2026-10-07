// =============================================================================
// AI Radar — Phase 8: Stripe Billing Provider
// =============================================================================
// Stripe implementation of IBillingProvider. Only active when
// STRIPE_SECRET_KEY is set. Falls back to MockBillingProvider otherwise.
// =============================================================================

import type { IBillingProvider, CreateCheckoutParams, CreatePortalParams, ParsedWebhookResult } from './billingProvider';
import type { CheckoutSessionResult, BillingPortalResult } from './types';
import { getPlanConfig } from './planConfig';
import { logger } from '@/lib/services/logger';

/**
 * Stripe provider implementation.
 * Uses dynamic import to avoid breaking builds when stripe package is absent.
 * The stripe npm package must be installed separately when going live:
 *   npm install stripe
 */
export class StripeBillingProvider implements IBillingProvider {
  readonly id = 'stripe';
  readonly displayName = 'Stripe';

  get isConfigured(): boolean {
    return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'));
  }

  private getStripeClient(): unknown {
    if (!this.isConfigured) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.');
    }
    try {
      // Dynamic require via eval to prevent webpack compile-time tracing when optional package is absent
      const req = (0, eval)('require');
      const Stripe = req('stripe');
      return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-09-30.acacia',
        typescript: true,
      });
    } catch {
      throw new Error(
        'Stripe package not found. Run: npm install stripe\n' +
        'Then set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET in .env.local.'
      );
    }
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const stripe = this.getStripeClient() as any;
    const plan = getPlanConfig(params.planSlug);

    const priceId = params.billingInterval === 'annual'
      ? plan.stripePriceIdAnnual
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new Error(
        `No Stripe price ID configured for plan '${params.planSlug}' (${params.billingInterval}). ` +
        'Set STRIPE_PRO_PRICE_ID_MONTHLY etc. in .env.local.'
      );
    }

    const customerId = params.existingCustomerId
      ? params.existingCustomerId
      : await this.ensureCustomer(params.userId, params.userEmail);

    const separator = params.successUrl.includes('?') ? '&' : '?';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${params.successUrl}${separator}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      metadata: {
        user_id: params.userId,
        plan_slug: params.planSlug,
        billing_interval: params.billingInterval,
      },
      allow_promotion_codes: true,
    });

    logger.info('Stripe checkout session created', {
      sessionId: session.id,
      userId: params.userId,
      planSlug: params.planSlug,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      provider: this.id,
    };
  }

  async createBillingPortal(params: CreatePortalParams): Promise<BillingPortalResult> {
    const stripe = this.getStripeClient() as any;
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return {
      portalUrl: session.url,
      provider: this.id,
    };
  }

  parseWebhook(payload: string, signature: string): ParsedWebhookResult {
    const stripe = this.getStripeClient() as any;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set. Webhook signature cannot be verified.');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    return {
      event: {
        id: event.id,
        type: event.type,
        data: event.data as Record<string, unknown>,
        provider: this.id,
      },
      rawPayload: event as unknown as Record<string, unknown>,
    };
  }

  async ensureCustomer(userId: string, email: string): Promise<string> {
    const stripe = this.getStripeClient() as any;

    // Try to find existing customer by metadata
    const existing = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      return existing.data[0].id;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: userId, source: 'ai-radar' },
    });

    return customer.id;
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const stripe = this.getStripeClient() as any;
    await stripe.subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async resumeSubscription(providerSubscriptionId: string): Promise<void> {
    const stripe = this.getStripeClient() as any;
    await stripe.subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: false,
    });
  }
}

export const stripeBillingProvider = new StripeBillingProvider();
