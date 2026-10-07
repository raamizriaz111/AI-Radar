// =============================================================================
// AI Radar — Lemon Squeezy Billing Provider
// =============================================================================
// Lemon Squeezy Merchant of Record (MoR) implementation of IBillingProvider.
// Handles international card, PayPal, and Apple/Google Pay payments in USD
// with automated sales tax and payouts directly to international bank accounts
// (including Pakistani bank accounts via Payoneer, Wise, or direct bank transfer).
// =============================================================================

import crypto from 'crypto';
import type {
  IBillingProvider,
  CreateCheckoutParams,
  CreatePortalParams,
  ParsedWebhookResult,
} from './billingProvider';
import type { CheckoutSessionResult, BillingPortalResult } from './types';
import { getPlanConfig } from './planConfig';
import { logger } from '@/lib/services/logger';

const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export class LemonSqueezyBillingProvider implements IBillingProvider {
  readonly id = 'lemonsqueezy';
  readonly displayName = 'Lemon Squeezy';

  get isConfigured(): boolean {
    const key = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    return Boolean(key && key.trim().length > 0 && storeId && storeId.trim().length > 0);
  }

  private getApiKey(): string {
    const key = process.env.LEMONSQUEEZY_API_KEY;
    if (!key) {
      throw new Error('Lemon Squeezy is not configured. Set LEMONSQUEEZY_API_KEY in .env.local.');
    }
    return key;
  }

  private getStoreId(): string {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) {
      throw new Error('Lemon Squeezy Store ID is not configured. Set LEMONSQUEEZY_STORE_ID in .env.local.');
    }
    return storeId;
  }

  /**
   * Helper to append query parameter safely without producing double '??'.
   */
  private appendQueryParam(url: string, key: string, value: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const apiKey = this.getApiKey();
    const storeId = this.getStoreId();
    const plan = getPlanConfig(params.planSlug);

    const variantId =
      params.billingInterval === 'annual'
        ? plan.lemonSqueezyVariantIdAnnual
        : plan.lemonSqueezyVariantIdMonthly;

    if (!variantId) {
      throw new Error(
        `No Lemon Squeezy variant ID configured for plan '${params.planSlug}' (${params.billingInterval}). ` +
          'Set LEMONSQUEEZY_PRO_VARIANT_ID_MONTHLY / LEMONSQUEEZY_ADVANCED_VARIANT_ID_MONTHLY etc. in .env.local.'
      );
    }

    const redirectUrl = this.appendQueryParam(params.successUrl, 'provider', 'lemonsqueezy');

    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
          checkout_data: {
            email: params.userEmail,
            discount_code: params.discountCode || undefined,
            custom: {
              user_id: params.userId,
              plan_slug: params.planSlug,
              billing_interval: params.billingInterval,
            },
          },
          product_options: {
            redirect_url: redirectUrl,
            receipt_thank_you_note: 'Thank you for subscribing to AI Radar! Your intelligence feeds and alerts are now unlocked.',
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantId),
            },
          },
        },
      },
    };

    const res = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('Lemon Squeezy checkout creation failed', {
        status: res.status,
        response: errText,
      });
      throw new Error(`Lemon Squeezy checkout failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const checkoutUrl = data?.data?.attributes?.url;
    const checkoutId = data?.data?.id;

    if (!checkoutUrl) {
      throw new Error('Lemon Squeezy did not return a valid checkout URL.');
    }

    logger.info('Lemon Squeezy checkout session created', {
      checkoutId,
      userId: params.userId,
      planSlug: params.planSlug,
    });

    return {
      sessionId: String(checkoutId),
      checkoutUrl,
      provider: this.id,
    };
  }

  async createBillingPortal(params: CreatePortalParams): Promise<BillingPortalResult> {
    const apiKey = this.getApiKey();

    // If customerId is provided, query Lemon Squeezy customer details
    try {
      const res = await fetch(`${LEMONSQUEEZY_API_BASE}/customers/${params.customerId}`, {
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const portalUrl = data?.data?.attributes?.urls?.customer_portal;
        if (portalUrl) {
          return {
            portalUrl,
            provider: this.id,
          };
        }
      }
    } catch (err) {
      logger.warn('Failed to retrieve Lemon Squeezy customer portal URL', {
        customerId: params.customerId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Default fallback to account billing return URL
    return {
      portalUrl: params.returnUrl,
      provider: this.id,
    };
  }

  parseWebhook(payload: string, signature: string): ParsedWebhookResult {
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET is not set. Webhook signature cannot be verified.');
    }

    if (!signature) {
      throw new Error('Missing webhook signature header (x-signature).');
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      throw new Error('Invalid Lemon Squeezy webhook signature.');
    }

    const raw = JSON.parse(payload) as Record<string, unknown>;
    const meta = (raw['meta'] as Record<string, unknown>) ?? {};
    const eventName = (meta['event_name'] as string) ?? '';
    const customData = (meta['custom_data'] as Record<string, unknown>) ?? {};
    const dataObj = (raw['data'] as Record<string, unknown>) ?? {};
    const attributes = (dataObj['attributes'] as Record<string, unknown>) ?? {};

    // Normalize event into unified standard platform types
    let mappedType = eventName;
    if (eventName === 'subscription_created' || eventName === 'order_created') {
      mappedType = 'checkout.session.completed';
    } else if (eventName === 'subscription_updated') {
      mappedType = 'customer.subscription.updated';
    } else if (eventName === 'subscription_cancelled') {
      mappedType = 'customer.subscription.updated';
    } else if (eventName === 'subscription_expired') {
      mappedType = 'customer.subscription.deleted';
    } else if (eventName === 'subscription_payment_success') {
      mappedType = 'invoice.payment_succeeded';
    } else if (eventName === 'subscription_payment_failed') {
      mappedType = 'invoice.payment_failed';
    }

    // Build normalized object matching expected schema
    const normalizedObject: Record<string, unknown> = {
      id: dataObj['id'] ?? (dataObj['type'] === 'subscriptions' ? dataObj['id'] : attributes['subscription_id']),
      status: attributes['status'] ?? 'active',
      cancel_at_period_end: Boolean(attributes['cancelled']),
      amount_paid: attributes['total'] ? Number(attributes['total']) : undefined,
      amount_due: attributes['total'] ? Number(attributes['total']) : undefined,
      currency: (attributes['currency'] as string)?.toLowerCase() ?? 'usd',
      hosted_invoice_url: (attributes['urls'] as any)?.receipt ?? (attributes['urls'] as any)?.customer_portal ?? null,
      metadata: {
        user_id: customData['user_id'] ?? attributes['user_id'],
        plan_slug: customData['plan_slug'] ?? attributes['plan_slug'],
        billing_interval: customData['billing_interval'] ?? attributes['billing_interval'] ?? 'monthly',
      },
    };

    return {
      event: {
        id: String(dataObj['id'] ?? `${eventName}-${Date.now()}`),
        type: mappedType,
        data: {
          object: normalizedObject,
          attributes,
          meta,
        },
        provider: this.id,
      },
      rawPayload: raw,
    };
  }

  async ensureCustomer(userId: string, email: string): Promise<string> {
    const apiKey = this.getApiKey();

    try {
      const res = await fetch(
        `${LEMONSQUEEZY_API_BASE}/customers?filter[email]=${encodeURIComponent(email)}`,
        {
          headers: {
            Accept: 'application/vnd.api+json',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (res.ok) {
        const body = await res.json();
        if (body?.data?.length > 0) {
          return String(body.data[0].id);
        }
      }
    } catch (err) {
      logger.warn('Failed to query Lemon Squeezy customer by email', {
        email,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return `ls_cust_${userId}`;
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const apiKey = this.getApiKey();

    const res = await fetch(`${LEMONSQUEEZY_API_BASE}/subscriptions/${providerSubscriptionId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('Failed to cancel Lemon Squeezy subscription', {
        providerSubscriptionId,
        status: res.status,
        error: errText,
      });
      throw new Error(`Failed to cancel Lemon Squeezy subscription: ${errText}`);
    }

    logger.info('Lemon Squeezy subscription canceled', { providerSubscriptionId });
  }

  async resumeSubscription(providerSubscriptionId: string): Promise<void> {
    const apiKey = this.getApiKey();

    const res = await fetch(`${LEMONSQUEEZY_API_BASE}/subscriptions/${providerSubscriptionId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: providerSubscriptionId,
          attributes: {
            cancelled: false,
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('Failed to resume Lemon Squeezy subscription', {
        providerSubscriptionId,
        status: res.status,
        error: errText,
      });
      throw new Error(`Failed to resume Lemon Squeezy subscription: ${errText}`);
    }

    logger.info('Lemon Squeezy subscription resumed', { providerSubscriptionId });
  }
}

export const lemonSqueezyBillingProvider = new LemonSqueezyBillingProvider();
