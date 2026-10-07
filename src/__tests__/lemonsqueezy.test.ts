// =============================================================================
// AI Radar — Lemon Squeezy Billing Integration Tests
// =============================================================================
// Verifies Lemon Squeezy provider configuration, checkout session payload,
// HMAC-SHA256 timing-safe webhook signature verification, and event mapping.
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { LemonSqueezyBillingProvider } from '@/lib/billing/lemonSqueezyProvider';
import { getBillingProvider } from '@/lib/billing';
import { POST as postSubscriptionRoute } from '@/app/api/billing/subscription/route';
import { setMockSession, clearMockSession } from '@/lib/auth/session';

describe('Lemon Squeezy Billing Integration', () => {
  const originalEnv = { ...process.env };
  const mockWebhookSecret = 'test_webhook_secret_lemon_12345';

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('detects isConfigured as false when keys are missing', () => {
    delete process.env.LEMONSQUEEZY_API_KEY;
    delete process.env.LEMONSQUEEZY_STORE_ID;
    const provider = new LemonSqueezyBillingProvider();
    expect(provider.isConfigured).toBe(false);
  });

  it('detects isConfigured as true when API key and store ID are present', () => {
    process.env.LEMONSQUEEZY_API_KEY = 'test_api_key_ls_xyz';
    process.env.LEMONSQUEEZY_STORE_ID = '987654';
    const provider = new LemonSqueezyBillingProvider();
    expect(provider.isConfigured).toBe(true);
  });

  it('getBillingProvider() returns Lemon Squeezy when configured', () => {
    process.env.LEMONSQUEEZY_API_KEY = 'test_api_key_ls_xyz';
    process.env.LEMONSQUEEZY_STORE_ID = '987654';
    const provider = getBillingProvider();
    expect(provider.id).toBe('lemonsqueezy');
    expect(provider.displayName).toBe('Lemon Squeezy');
  });

  it('verifies valid HMAC-SHA256 webhook signatures', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = mockWebhookSecret;
    const provider = new LemonSqueezyBillingProvider();

    const payload = JSON.stringify({
      meta: {
        event_name: 'subscription_created',
        custom_data: {
          user_id: 'user_123',
          plan_slug: 'pro',
          billing_interval: 'monthly',
        },
      },
      data: {
        id: 'sub_ls_999',
        type: 'subscriptions',
        attributes: {
          status: 'active',
          cancelled: false,
          total: 1000,
          currency: 'USD',
          user_email: 'buyer@example.com',
        },
      },
    });

    const hmac = crypto.createHmac('sha256', mockWebhookSecret);
    const validSignature = hmac.update(payload).digest('hex');

    const result = provider.parseWebhook(payload, validSignature);
    expect(result.event.type).toBe('checkout.session.completed');
    expect(result.event.provider).toBe('lemonsqueezy');
    expect((result.event.data.object as any).metadata.user_id).toBe('user_123');
    expect((result.event.data.object as any).metadata.plan_slug).toBe('pro');
    expect((result.event.data.object as any).amount_paid).toBe(1000);
  });

  it('rejects tampered or invalid webhook signatures', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = mockWebhookSecret;
    const provider = new LemonSqueezyBillingProvider();

    const payload = JSON.stringify({ test: 'tampered_data' });
    const forgedSignature = 'forged_signature_0000000000000000000000000000000000000000000000000000000000000000';

    expect(() => provider.parseWebhook(payload, forgedSignature)).toThrow(/Invalid Lemon Squeezy webhook signature/);
  });

  it('throws when LEMONSQUEEZY_WEBHOOK_SECRET is not set', () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const provider = new LemonSqueezyBillingProvider();

    expect(() => provider.parseWebhook('{}', 'some_sig')).toThrow(/LEMONSQUEEZY_WEBHOOK_SECRET is not set/);
  });

  it('correctly normalizes subscription_updated and cancellation events', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = mockWebhookSecret;
    const provider = new LemonSqueezyBillingProvider();

    const cancelPayload = JSON.stringify({
      meta: {
        event_name: 'subscription_cancelled',
        custom_data: { user_id: 'user_456' },
      },
      data: {
        id: 'sub_ls_888',
        type: 'subscriptions',
        attributes: {
          status: 'active',
          cancelled: true,
          total: 2000,
        },
      },
    });

    const hmac = crypto.createHmac('sha256', mockWebhookSecret);
    const sig = hmac.update(cancelPayload).digest('hex');

    const result = provider.parseWebhook(cancelPayload, sig);
    expect(result.event.type).toBe('customer.subscription.updated');
    expect((result.event.data.object as any).cancel_at_period_end).toBe(true);
  });

  it('correctly maps payment success and failure events to invoice actions', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = mockWebhookSecret;
    const provider = new LemonSqueezyBillingProvider();

    const paymentSuccessPayload = JSON.stringify({
      meta: { event_name: 'subscription_payment_success' },
      data: {
        id: 'inv_ls_777',
        type: 'subscription-invoices',
        attributes: {
          total: 1000,
          currency: 'USD',
          status: 'paid',
        },
      },
    });

    const hmac = crypto.createHmac('sha256', mockWebhookSecret);
    const sig = hmac.update(paymentSuccessPayload).digest('hex');

    const result = provider.parseWebhook(paymentSuccessPayload, sig);
    expect(result.event.type).toBe('invoice.payment_succeeded');
    expect((result.event.data.object as any).amount_paid).toBe(1000);
  });

  it('blocks public visitors in production from activating paid tiers without checkout', async () => {
    (process.env as any).NODE_ENV = 'production';
    setMockSession({ id: 'visitor_1', email: 'visitor@example.com', role: 'user' });

    const req = new NextRequest('http://localhost:3000/api/billing/subscription', {
      method: 'POST',
      body: JSON.stringify({ planSlug: 'pro' }),
    });

    const res = await postSubscriptionRoute(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Lemon Squeezy checkout');
    expect(data.requiresCheckout).toBe(true);
    clearMockSession();
  });

  it('allows admin in production to activate paid tiers in test mode', async () => {
    (process.env as any).NODE_ENV = 'production';
    setMockSession({ id: 'admin_1', email: 'admin@example.com', role: 'admin' });

    const req = new NextRequest('http://localhost:3000/api/billing/subscription', {
      method: 'POST',
      body: JSON.stringify({ planSlug: 'pro' }),
    });

    const res = await postSubscriptionRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.plan.slug).toBe('pro');
    clearMockSession();
  });

  it('allows public visitors to downgrade to free tier without checkout', async () => {
    (process.env as any).NODE_ENV = 'production';
    setMockSession({ id: 'visitor_1', email: 'visitor@example.com', role: 'user' });

    const req = new NextRequest('http://localhost:3000/api/billing/subscription', {
      method: 'POST',
      body: JSON.stringify({ planSlug: 'free' }),
    });

    const res = await postSubscriptionRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.plan.slug).toBe('free');
    clearMockSession();
  });
});
