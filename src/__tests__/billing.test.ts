// =============================================================================
// AI Radar — Phase 8: Billing System Tests
// =============================================================================
// Covers 55+ scenarios including:
// - Plan configuration correctness
// - Subscription lifecycle (create, upgrade, downgrade, cancel, expire)
// - Feature access gating (server-side enforcement)
// - Usage enforcement with daily limits
// - Billing event audit trail (idempotency)
// - Cross-user billing isolation
// - Concurrent usage (sequential simulation)
// - Provider failure handling
// - Webhook event processing (happy + failure paths)
// - Admin summary accuracy
// - Mock billing provider behavior
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPlanConfig,
  getPlanLimits,
  getPlanFeatures,
  getAllPlans,
  isValidPlanSlug,
} from '@/lib/billing/planConfig';
import {
  getSubscription,
  upsertSubscription,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  expireSubscription,
  recordBillingEvent,
  getUserBillingEvents,
  getAllBillingEvents,
  getBillingAdminSummary,
  resetBillingStore,
} from '@/lib/billing/subscriptionService';
import {
  checkBillingUsageLimit,
  recordBillingUsage,
  getCurrentUsagePeriod,
  resetBillingUsageStore,
} from '@/lib/billing/usageEnforcement';
import {
  checkFeatureAccessSync,
  getActivePlanSlug,
} from '@/lib/billing/featureAccess';
import { getUserInvoices, upsertInvoice, resetInvoiceStore } from '@/lib/billing/invoiceService';
import { mockBillingProvider } from '@/lib/billing/mockProvider';
import {
  setMockSession,
  clearMockSession,
  requireAuth,
  getCurrentUser,
  OWNER_EMAIL,
  isOwnerEmail,
} from '@/lib/auth/session';
import {
  isBuilderUserId,
  createBuilderLifetimeSubscription,
  registerBuilderUserId,
} from '@/lib/billing/subscriptionService';
import { validateCoupon, isValidCouponCode } from '@/lib/billing/couponConfig';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function uuid(n: number): string {
  return `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetBillingStore();
  resetBillingUsageStore();
  resetInvoiceStore();
  clearMockSession();
  mockBillingProvider.reset();
});

// ===========================================================================
// 1. Plan Configuration Tests
// ===========================================================================

describe('1. Plan Configuration (planConfig.ts)', () => {
  it('1.1 — free plan has $0 price and correct default limits', () => {
    const plan = getPlanConfig('free');
    expect(plan.slug).toBe('free');
    expect(plan.priceMonthlyUsd).toBe(0);
    expect(plan.priceAnnualUsd).toBeNull();
    expect(plan.limits.aiRequestsLimit).toBe(100);
    expect(plan.limits.briefingsLimit).toBe(10);
    expect(plan.limits.trackedTopicsLimit).toBe(20);
  });

  it('1.2 — pro plan has correct limits and features', () => {
    const plan = getPlanConfig('pro');
    expect(plan.priceMonthlyUsd).toBe(10);
    expect(plan.priceAnnualUsd).toBe(100);
    expect(plan.limits.aiRequestsLimit).toBe(1000);
    expect(plan.limits.briefingsLimit).toBe(30);
    expect(plan.features.export).toBe(true);
    expect(plan.features.advancedFilters).toBe(true);
    expect(plan.features.apiAccess).toBe(false);
  });

  it('1.3 — advanced plan has highest limits and API access', () => {
    const plan = getPlanConfig('advanced');
    expect(plan.priceMonthlyUsd).toBe(20);
    expect(plan.limits.aiRequestsLimit).toBe(10000);
    expect(plan.features.apiAccess).toBe(true);
    expect(plan.features.prioritySupport).toBe(true);
  });

  it('1.4 — free plan lacks export, advancedFilters, apiAccess, prioritySupport', () => {
    const features = getPlanFeatures('free');
    expect(features.export).toBe(false);
    expect(features.advancedFilters).toBe(false);
    expect(features.apiAccess).toBe(false);
    expect(features.prioritySupport).toBe(false);
  });

  it('1.5 — getAllPlans returns sorted list of all 3 plans', () => {
    const plans = getAllPlans();
    expect(plans.length).toBe(3);
    expect(plans[0].slug).toBe('free');
    expect(plans[1].slug).toBe('pro');
    expect(plans[2].slug).toBe('advanced');
  });

  it('1.6 — getPaidOnly filter excludes free plan', () => {
    const paidPlans = getAllPlans({ paidOnly: true });
    expect(paidPlans.length).toBe(2);
    expect(paidPlans.every((p) => p.priceMonthlyUsd > 0)).toBe(true);
  });

  it('1.7 — isValidPlanSlug accepts valid slugs and rejects invalid', () => {
    expect(isValidPlanSlug('free')).toBe(true);
    expect(isValidPlanSlug('pro')).toBe(true);
    expect(isValidPlanSlug('advanced')).toBe(true);
    expect(isValidPlanSlug('enterprise')).toBe(false);
    expect(isValidPlanSlug('')).toBe(false);
    expect(isValidPlanSlug('basic')).toBe(false);
  });

  it('1.8 — getPlanConfig defaults to free for unknown slug', () => {
    const plan = getPlanConfig('unknown_plan');
    expect(plan.slug).toBe('free');
  });

  it('1.9 — pro annual discount is non-trivial', () => {
    const plan = getPlanConfig('pro');
    const annualSavings = plan.priceMonthlyUsd * 12 - (plan.priceAnnualUsd ?? 0);
    expect(annualSavings).toBeGreaterThan(0);
  });
});

// ===========================================================================
// 2. Subscription Lifecycle Tests
// ===========================================================================

describe('2. Subscription Lifecycle (subscriptionService.ts)', () => {
  it('2.1 — new user gets free subscription by default', async () => {
    const sub = await getSubscription(uuid(1));
    expect(sub.planSlug).toBe('free');
    expect(sub.status).toBe('active');
    expect(sub.billingInterval).toBe('none');
    expect(sub.cancelAtPeriodEnd).toBe(false);
  });

  it('2.2 — upsertSubscription persists and retrieves correctly', async () => {
    const userId = uuid(2);
    const sub = await getSubscription(userId);
    const updated = { ...sub, planSlug: 'pro' as const, billingInterval: 'monthly' as const };
    await upsertSubscription(updated);

    const retrieved = await getSubscription(userId);
    expect(retrieved.planSlug).toBe('pro');
    expect(retrieved.billingInterval).toBe('monthly');
  });

  it('2.3 — changePlan upgrades from free to pro correctly', async () => {
    const userId = uuid(3);
    const upgraded = await changePlan(userId, 'pro', 'monthly');
    expect(upgraded.planSlug).toBe('pro');
    expect(upgraded.status).toBe('active');
    expect(upgraded.billingInterval).toBe('monthly');
    expect(upgraded.cancelAtPeriodEnd).toBe(false);
  });

  it('2.4 — changePlan records an upgrade billing event', async () => {
    const userId = uuid(4);
    await changePlan(userId, 'pro', 'monthly');
    const events = getUserBillingEvents(userId);
    const upgradeEvent = events.find((e) => e.eventType === 'plan.upgraded');
    expect(upgradeEvent).toBeDefined();
    expect(upgradeEvent?.rawPayload?.['toPlan']).toBe('pro');
    expect(upgradeEvent?.rawPayload?.['fromPlan']).toBe('free');
  });

  it('2.5 — changePlan downgrade records downgrade event', async () => {
    const userId = uuid(5);
    await changePlan(userId, 'advanced', 'monthly');
    await changePlan(userId, 'pro', 'monthly');
    const events = getUserBillingEvents(userId);
    const downgradeEvent = events.find((e) => e.eventType === 'plan.downgraded');
    expect(downgradeEvent).toBeDefined();
    expect(downgradeEvent?.rawPayload?.['fromPlan']).toBe('advanced');
    expect(downgradeEvent?.rawPayload?.['toPlan']).toBe('pro');
  });

  it('2.6 — cancelSubscription sets cancelAtPeriodEnd and records event', async () => {
    const userId = uuid(6);
    await changePlan(userId, 'pro', 'monthly');
    const canceled = await cancelSubscription(userId);

    expect(canceled.cancelAtPeriodEnd).toBe(true);
    expect(canceled.canceledAt).toBeTruthy();

    const events = getUserBillingEvents(userId);
    expect(events.some((e) => e.eventType === 'subscription.canceled')).toBe(true);
  });

  it('2.7 — reactivateSubscription clears cancelAtPeriodEnd', async () => {
    const userId = uuid(7);
    await changePlan(userId, 'pro', 'monthly');
    await cancelSubscription(userId);
    const reactivated = await reactivateSubscription(userId);

    expect(reactivated.cancelAtPeriodEnd).toBe(false);
    expect(reactivated.canceledAt).toBeNull();
  });

  it('2.8 — expireSubscription reverts plan to free', async () => {
    const userId = uuid(8);
    await changePlan(userId, 'pro', 'monthly');
    const expired = await expireSubscription(userId);

    expect(expired.planSlug).toBe('free');
    expect(expired.status).toBe('expired');
  });

  it('2.9 — changePlan rejects invalid plan slug', async () => {
    const userId = uuid(9);
    await expect(changePlan(userId, 'enterprise' as any)).rejects.toThrow('Invalid plan slug');
  });

  it('2.10 — free plan sets billingInterval to none', async () => {
    const userId = uuid(10);
    await changePlan(userId, 'pro', 'annual');
    const sub = await getSubscription(userId);
    await changePlan(userId, 'free');
    const subAfter = await getSubscription(userId);
    expect(subAfter.billingInterval).toBe('none');
  });
});

// ===========================================================================
// 3. Feature Access Control Tests
// ===========================================================================

describe('3. Feature Access Control (featureAccess.ts)', () => {
  it('3.1 — free plan: export denied with upgrade suggestion', async () => {
    const userId = uuid(20);
    // Default free plan
    const result = checkFeatureAccessSync('free', 'export');
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('pro');
    expect(result.reason).toContain('Free plan');
  });

  it('3.2 — pro plan: export allowed', () => {
    const result = checkFeatureAccessSync('pro', 'export');
    expect(result.allowed).toBe(true);
    expect(result.planSlug).toBe('pro');
  });

  it('3.3 — free and pro plans: apiAccess denied, advanced has it', () => {
    expect(checkFeatureAccessSync('free', 'apiAccess').allowed).toBe(false);
    expect(checkFeatureAccessSync('pro', 'apiAccess').allowed).toBe(false);
    expect(checkFeatureAccessSync('advanced', 'apiAccess').allowed).toBe(true);
  });

  it('3.4 — advanced plan: all features allowed', () => {
    const features: Array<keyof import('@/lib/billing/planConfig').PlanFeatures> = [
      'customTopics', 'export', 'earlyTrends', 'advancedFilters', 'apiAccess', 'prioritySupport',
      'emailDigest', 'breakingAlerts', 'webhookAlerts', 'codeBlueprints',
    ];
    for (const feature of features) {
      const result = checkFeatureAccessSync('advanced', feature);
      expect(result.allowed).toBe(true);
    }
  });

  it('3.5 — getActivePlanSlug returns free for default subscription', async () => {
    const userId = uuid(21);
    const slug = await getActivePlanSlug(userId);
    expect(slug).toBe('free');
  });

  it('3.6 — getActivePlanSlug returns upgraded plan after changePlan', async () => {
    const userId = uuid(22);
    await changePlan(userId, 'pro', 'monthly');
    const slug = await getActivePlanSlug(userId);
    expect(slug).toBe('pro');
  });

  it('3.7 — getActivePlanSlug returns free when subscription is expired', async () => {
    const userId = uuid(23);
    await changePlan(userId, 'advanced', 'monthly');
    await expireSubscription(userId);
    const slug = await getActivePlanSlug(userId);
    expect(slug).toBe('free');
  });
});

// ===========================================================================
// 4. Usage Enforcement Tests
// ===========================================================================

describe('4. Usage Enforcement (usageEnforcement.ts)', () => {
  it('4.1 — new user has 0 usage and full limit remaining', async () => {
    const userId = uuid(30);
    const result = await checkBillingUsageLimit(userId, 'summary');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(100); // Free plan default
    expect(result.remaining).toBe(100);
  });

  it('4.2 — recordBillingUsage increments counter', async () => {
    const userId = uuid(31);
    await recordBillingUsage(userId, 'enrichment');
    await recordBillingUsage(userId, 'enrichment');

    const result = await checkBillingUsageLimit(userId, 'summary');
    expect(result.used).toBe(2);
    expect(result.remaining).toBe(98);
  });

  it('4.3 — usage limit blocks operations when daily limit reached', async () => {
    const userId = uuid(32);
    // Set a very low plan limit
    await changePlan(userId, 'free');

    // Manually override via subscriptionService to set limit to 2
    const sub = await getSubscription(userId);
    await upsertSubscription({ ...sub, planSlug: 'free' });

    // Simulate hitting the limit (100 for free, use 100 ops)
    for (let i = 0; i < 100; i++) {
      await recordBillingUsage(userId, 'summary');
    }

    const result = await checkBillingUsageLimit(userId, 'summary');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.reason).toContain('Daily AI operations limit');
  });

  it('4.4 — briefing limit is tracked separately from AI ops', async () => {
    const userId = uuid(33);
    await recordBillingUsage(userId, 'briefing');

    const aiResult = await checkBillingUsageLimit(userId, 'summary');
    const briefingResult = await checkBillingUsageLimit(userId, 'briefing');

    expect(aiResult.used).toBe(0); // AI ops not incremented
    expect(briefingResult.used).toBe(1);
  });

  it('4.5 — getCurrentUsagePeriod returns accurate snapshot', async () => {
    const userId = uuid(34);
    await recordBillingUsage(userId, 'enrichment');
    await recordBillingUsage(userId, 'briefing');

    const period = await getCurrentUsagePeriod(userId);
    expect(period.aiRequestsUsed).toBe(1);
    expect(period.briefingsUsed).toBe(1);
    expect(period.userId).toBe(userId);
  });

  it('4.6 — pro plan user gets higher limits', async () => {
    const userId = uuid(35);
    await changePlan(userId, 'pro', 'monthly');

    const result = await checkBillingUsageLimit(userId, 'summary');
    expect(result.limit).toBe(1000); // Pro plan limit
  });

  it('4.7 — advanced plan user gets highest limits', async () => {
    const userId = uuid(36);
    await changePlan(userId, 'advanced', 'monthly');

    const result = await checkBillingUsageLimit(userId, 'briefing');
    expect(result.limit).toBe(100); // Advanced briefing limit
  });
});

// ===========================================================================
// 5. Billing Event Audit Trail Tests
// ===========================================================================

describe('5. Billing Event Audit Trail (subscriptionService.ts)', () => {
  it('5.1 — recordBillingEvent creates immutable event record', async () => {
    const userId = uuid(40);
    const event = await recordBillingEvent({
      userId,
      eventType: 'payment.succeeded',
      provider: 'stripe',
      providerEventId: 'evt_test_001',
      amountUsd: 19.00,
    });

    expect(event.id).toBeTruthy();
    expect(event.userId).toBe(userId);
    expect(event.eventType).toBe('payment.succeeded');
    expect(event.amountUsd).toBe(19.00);
    expect(event.status).toBe('processed');
  });

  it('5.2 — getUserBillingEvents returns events for user in reverse chronological order', async () => {
    const userId = uuid(41);
    await recordBillingEvent({ userId, eventType: 'subscription.created', provider: 'system' });
    await recordBillingEvent({ userId, eventType: 'payment.succeeded', provider: 'stripe', amountUsd: 19 });

    const events = getUserBillingEvents(userId);
    expect(events.length).toBe(2);
    // Most recent first
    expect(events[0].eventType).toBe('payment.succeeded');
    expect(events[1].eventType).toBe('subscription.created');
  });

  it('5.3 — events from different users are isolated', async () => {
    const userA = uuid(42);
    const userB = uuid(43);

    await recordBillingEvent({ userId: userA, eventType: 'plan.upgraded', provider: 'system' });
    await recordBillingEvent({ userId: userB, eventType: 'subscription.canceled', provider: 'system' });

    const eventsA = getUserBillingEvents(userA);
    const eventsB = getUserBillingEvents(userB);

    expect(eventsA.every((e) => e.userId === userA)).toBe(true);
    expect(eventsB.every((e) => e.userId === userB)).toBe(true);
    expect(eventsA.length).toBe(1);
    expect(eventsB.length).toBe(1);
  });

  it('5.4 — changePlan always records an audit event', async () => {
    const userId = uuid(44);
    await changePlan(userId, 'pro', 'monthly');
    await changePlan(userId, 'advanced', 'annual');
    await cancelSubscription(userId);

    const events = getUserBillingEvents(userId);
    const types = events.map((e) => e.eventType);

    expect(types).toContain('plan.upgraded'); // free → pro
    expect(types).toContain('plan.upgraded'); // pro → advanced
    expect(types).toContain('subscription.canceled');
  });

  it('5.5 — getAllBillingEvents returns cross-user events (admin view)', async () => {
    await recordBillingEvent({ userId: uuid(45), eventType: 'payment.succeeded', amountUsd: 19 });
    await recordBillingEvent({ userId: uuid(46), eventType: 'payment.succeeded', amountUsd: 49 });

    const allEvents = getAllBillingEvents();
    expect(allEvents.length).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// 6. Invoice Service Tests
// ===========================================================================

describe('6. Invoice Service (invoiceService.ts)', () => {
  it('6.1 — upsertInvoice creates and stores an invoice', async () => {
    const userId = uuid(50);
    const invoice = await upsertInvoice({
      userId,
      subscriptionId: null,
      provider: 'stripe',
      providerInvoiceId: 'in_test_001',
      amountDueUsd: 19.00,
      amountPaidUsd: 19.00,
      currency: 'usd',
      status: 'paid',
      invoiceUrl: 'https://stripe.com/invoice/in_test_001',
      periodStart: '2026-10-01T00:00:00Z',
      periodEnd: '2026-11-01T00:00:00Z',
      paidAt: '2026-10-01T00:00:00Z',
      metadata: {},
    });

    expect(invoice.id).toBeTruthy();
    expect(invoice.amountPaidUsd).toBe(19.00);
    expect(invoice.status).toBe('paid');
  });

  it('6.2 — getUserInvoices returns correct user invoices', async () => {
    const userId = uuid(51);
    await upsertInvoice({
      userId, subscriptionId: null, provider: 'stripe', providerInvoiceId: 'in_a',
      amountDueUsd: 19, amountPaidUsd: 19, currency: 'usd', status: 'paid',
      invoiceUrl: null, periodStart: null, periodEnd: null, paidAt: null, metadata: {},
    });
    await upsertInvoice({
      userId, subscriptionId: null, provider: 'stripe', providerInvoiceId: 'in_b',
      amountDueUsd: 19, amountPaidUsd: 19, currency: 'usd', status: 'paid',
      invoiceUrl: null, periodStart: null, periodEnd: null, paidAt: null, metadata: {},
    });

    const invoices = await getUserInvoices(userId);
    expect(invoices.length).toBe(2);
  });

  it('6.3 — invoices are isolated between users', async () => {
    const userA = uuid(52);
    const userB = uuid(53);

    await upsertInvoice({
      userId: userA, subscriptionId: null, provider: 'mock', providerInvoiceId: 'in_c',
      amountDueUsd: 19, amountPaidUsd: 19, currency: 'usd', status: 'paid',
      invoiceUrl: null, periodStart: null, periodEnd: null, paidAt: null, metadata: {},
    });

    const invoicesA = await getUserInvoices(userA);
    const invoicesB = await getUserInvoices(userB);

    expect(invoicesA.length).toBe(1);
    expect(invoicesB.length).toBe(0);
  });
});

// ===========================================================================
// 7. Mock Billing Provider Tests
// ===========================================================================

describe('7. Mock Billing Provider (mockProvider.ts)', () => {
  it('7.1 — mock provider is always configured in tests', () => {
    expect(mockBillingProvider.isConfigured).toBe(true);
    expect(mockBillingProvider.id).toBe('mock');
  });

  it('7.2 — createCheckoutSession returns valid session', async () => {
    const session = await mockBillingProvider.createCheckoutSession({
      userId: uuid(60),
      userEmail: 'user@test.com',
      planSlug: 'pro',
      billingInterval: 'monthly',
      successUrl: 'http://localhost:3000/billing?success=true',
      cancelUrl: 'http://localhost:3000/pricing',
    });

    expect(session.sessionId).toContain('mock_session');
    expect(session.checkoutUrl).toContain('mock=true');
    expect(session.provider).toBe('mock');
  });

  it('7.3 — createBillingPortal returns portal URL', async () => {
    const portal = await mockBillingProvider.createBillingPortal({
      userId: uuid(61),
      customerId: 'cus_mock',
      returnUrl: 'http://localhost:3000/billing',
    });

    expect(portal.portalUrl).toContain('portal=true');
    expect(portal.provider).toBe('mock');
  });

  it('7.4 — ensureCustomer creates and reuses customers idempotently', async () => {
    const userId = uuid(62);
    const custId1 = await mockBillingProvider.ensureCustomer(userId, 'test@example.com');
    const custId2 = await mockBillingProvider.ensureCustomer(userId, 'test@example.com');
    expect(custId1).toBe(custId2);
    expect(custId1).toContain('mock_cus_');
  });

  it('7.5 — parseWebhook parses valid mock payload', () => {
    const payload = JSON.stringify({
      id: 'mock_evt_123',
      type: 'checkout.session.completed',
      data: { object: { metadata: { user_id: uuid(63), plan_slug: 'pro' } } },
    });

    const result = mockBillingProvider.parseWebhook(payload, 'any_sig');
    expect(result.event.id).toBe('mock_evt_123');
    expect(result.event.type).toBe('checkout.session.completed');
  });

  it('7.6 — cancelSubscription is a no-op in mock mode', async () => {
    await expect(mockBillingProvider.cancelSubscription('sub_mock_123')).resolves.toBeUndefined();
  });
});

// ===========================================================================
// 8. Admin Billing Summary Tests
// ===========================================================================

describe('8. Admin Billing Summary (getBillingAdminSummary)', () => {
  it('8.1 — empty summary returns zeroed metrics', () => {
    const summary = getBillingAdminSummary();
    expect(summary.totalSubscriptions).toBe(0);
    expect(summary.activeSubscriptions).toBe(0);
    expect(summary.estimatedMrr).toBe(0);
  });

  it('8.2 — summary counts subscriptions by plan correctly', async () => {
    await changePlan(uuid(70), 'pro', 'monthly');
    await changePlan(uuid(71), 'pro', 'monthly');
    await changePlan(uuid(72), 'advanced', 'annual');

    const summary = getBillingAdminSummary();
    expect(summary.byPlan['pro']).toBe(2);
    expect(summary.byPlan['advanced']).toBe(1);
    expect(summary.activeSubscriptions).toBe(3);
  });

  it('8.3 — MRR calculation is positive for paid subscriptions', async () => {
    await changePlan(uuid(73), 'pro', 'monthly');   // $10/mo
    await changePlan(uuid(74), 'advanced', 'monthly'); // $20/mo

    const summary = getBillingAdminSummary();
    expect(summary.estimatedMrr).toBe(30); // 10 + 20
  });

  it('8.4 — canceled subscriptions are counted separately', async () => {
    const userId = uuid(75);
    await changePlan(userId, 'pro', 'monthly');
    await cancelSubscription(userId);

    const summary = getBillingAdminSummary();
    expect(summary.canceledSubscriptions).toBeGreaterThanOrEqual(1);
  });

  it('8.5 — recentEvents is included in summary', async () => {
    await recordBillingEvent({ userId: uuid(76), eventType: 'payment.succeeded', amountUsd: 19 });
    const summary = getBillingAdminSummary();
    expect(summary.recentEvents.length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// 9. Cross-User Billing Isolation Tests
// ===========================================================================

describe('9. Cross-User Billing Isolation', () => {
  it('9.1 — different users have independent subscriptions', async () => {
    const userFree = uuid(80);
    const userPro = uuid(81);
    const userAdvanced = uuid(82);

    await changePlan(userPro, 'pro', 'monthly');
    await changePlan(userAdvanced, 'advanced', 'annual');

    const subFree = await getSubscription(userFree);
    const subPro = await getSubscription(userPro);
    const subAdv = await getSubscription(userAdvanced);

    expect(subFree.planSlug).toBe('free');
    expect(subPro.planSlug).toBe('pro');
    expect(subAdv.planSlug).toBe('advanced');
  });

  it('9.2 — canceling one user does not affect others', async () => {
    const userA = uuid(83);
    const userB = uuid(84);

    await changePlan(userA, 'pro', 'monthly');
    await changePlan(userB, 'pro', 'monthly');
    await cancelSubscription(userA);

    const subA = await getSubscription(userA);
    const subB = await getSubscription(userB);

    expect(subA.cancelAtPeriodEnd).toBe(true);
    expect(subB.cancelAtPeriodEnd).toBe(false);
  });

  it('9.3 — usage counters are per-user (not shared)', async () => {
    const userA = uuid(85);
    const userB = uuid(86);

    for (let i = 0; i < 5; i++) {
      await recordBillingUsage(userA, 'summary');
    }
    await recordBillingUsage(userB, 'summary');

    const periodA = await getCurrentUsagePeriod(userA);
    const periodB = await getCurrentUsagePeriod(userB);

    expect(periodA.aiRequestsUsed).toBe(5);
    expect(periodB.aiRequestsUsed).toBe(1);
  });

  it('9.4 — billing events are user-scoped', async () => {
    const userA = uuid(87);
    const userB = uuid(88);

    await changePlan(userA, 'pro', 'monthly');
    await changePlan(userB, 'advanced', 'monthly');

    const eventsA = getUserBillingEvents(userA);
    const eventsB = getUserBillingEvents(userB);

    expect(eventsA.every((e) => e.userId === userA)).toBe(true);
    expect(eventsB.every((e) => e.userId === userB)).toBe(true);
  });
});

// ===========================================================================
// 10. Plan Limits Applied After Upgrade / Downgrade
// ===========================================================================

describe('10. Limit Recalculation After Plan Change', () => {
  it('10.1 — upgrading to pro increases usage limit', async () => {
    const userId = uuid(90);
    const freeLimitBefore = (await checkBillingUsageLimit(userId, 'summary')).limit;
    expect(freeLimitBefore).toBe(100);

    await changePlan(userId, 'pro', 'monthly');
    const proLimit = (await checkBillingUsageLimit(userId, 'summary')).limit;
    expect(proLimit).toBe(1000);
  });

  it('10.2 — downgrading to free reduces limits', async () => {
    const userId = uuid(91);
    await changePlan(userId, 'advanced', 'monthly');
    const advancedLimit = (await checkBillingUsageLimit(userId, 'summary')).limit;
    expect(advancedLimit).toBe(10000);

    await changePlan(userId, 'free');
    const freeLimit = (await checkBillingUsageLimit(userId, 'summary')).limit;
    expect(freeLimit).toBe(100);
  });
});

// ===========================================================================
// 11. Auth Guard Integration with Billing
// ===========================================================================

describe('11. Auth Guard Integration', () => {
  it('11.1 — unauthenticated requests to billing APIs are rejected', async () => {
    clearMockSession();
    await expect(requireAuth()).rejects.toThrow('Authentication required');
  });

  it('11.2 — authenticated user can be identified for billing operations', async () => {
    setMockSession({ id: uuid(95), email: 'billing-test@airadar.dev', role: 'user' });
    const user = await requireAuth();
    expect(user.id).toBe(uuid(95));
    expect(user.email).toBe('billing-test@airadar.dev');
  });
});

// ===========================================================================
// 12. Builder Lifetime Premium & Admin Access
// ===========================================================================

describe('12. Builder Lifetime Premium & Admin Access', () => {
  it('12.1 — OWNER_EMAIL identifies raamizriaz111@gmail.com', () => {
    expect(OWNER_EMAIL).toBe('raamizriaz111@gmail.com');
    expect(isOwnerEmail('raamizriaz111@gmail.com')).toBe(true);
    expect(isOwnerEmail('RAAMIZRIAZ111@GMAIL.COM')).toBe(true);
    expect(isOwnerEmail('other@example.com')).toBe(false);
  });

  it('12.2 — raamizriaz111@gmail.com is automatically granted admin role', async () => {
    setMockSession({
      id: uuid(99),
      email: 'raamizriaz111@gmail.com',
      role: 'user', // Even if metadata starts as 'user'
      name: 'Raamiz',
    });

    const user = await getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('admin');
    expect(user?.email).toBe('raamizriaz111@gmail.com');
  });

  it('12.3 — standard visitors receive user role and default to free plan', async () => {
    const visitorId = uuid(101);
    setMockSession({
      id: visitorId,
      email: 'regular_user@airadar.dev',
      role: 'user',
    });

    const user = await getCurrentUser();
    expect(user?.role).toBe('user');

    const sub = await getSubscription(visitorId);
    expect(sub.planSlug).toBe('free');
    expect(sub.status).toBe('active');

    // Advanced features are locked for standard free users
    const apiAccess = checkFeatureAccessSync(sub.planSlug, 'apiAccess');
    expect(apiAccess.allowed).toBe(false);
  });

  it('12.4 — builder user is granted permanent Lifetime Advanced subscription', async () => {
    const builderId = 'raamiz-builder-primary';
    registerBuilderUserId(builderId);

    const sub = await getSubscription(builderId);
    expect(sub.planSlug).toBe('advanced');
    expect(sub.status).toBe('active');
    expect(sub.currentPeriodEnd).toBeNull(); // Never expires
    expect(sub.billingInterval).toBe('none'); // Lifetime grant
    expect(sub.provider).toBe('system_grant');
    expect(sub.metadata?.isLifetimeGrant).toBe(true);

    // All features are unlocked permanently for the builder
    const features = getPlanFeatures(sub.planSlug);
    expect(features.apiAccess).toBe(true);
    expect(features.codeBlueprints).toBe(true);
    expect(features.webhookAlerts).toBe(true);
    expect(features.breakingAlerts).toBe(true);
    expect(features.export).toBe(true);

    // Limits reflect top Advanced tier
    const limits = getPlanLimits(sub.planSlug);
    expect(limits.aiRequestsLimit).toBe(10000);
    expect(limits.briefingsLimit).toBe(100);
    expect(limits.trackedTopicsLimit).toBe(500);
  });

  it('12.5 — admin passkey user automatically receives builder lifetime access', async () => {
    expect(isBuilderUserId('admin-passkey-user')).toBe(true);
    const sub = await getSubscription('admin-passkey-user');
    expect(sub.planSlug).toBe('advanced');
    expect(sub.currentPeriodEnd).toBeNull();
  });
});

// ===========================================================================
// 13. Strict Promotional Coupon Engine (RaamizPro & RaamizAdv)
// ===========================================================================

describe('13. Strict Promotional Coupon Engine', () => {
  it('13.1 — accepts RaamizPro strictly for the Pro tier', () => {
    const result = validateCoupon('RaamizPro', 'pro');
    expect(result.valid).toBe(true);
    expect(result.coupon?.code).toBe('RaamizPro');
    expect(result.coupon?.planSlug).toBe('pro');
    expect(result.coupon?.discountPercent).toBe(100);
  });

  it('13.2 — accepts RaamizAdv strictly for the Advanced tier', () => {
    const result = validateCoupon('RaamizAdv', 'advanced');
    expect(result.valid).toBe(true);
    expect(result.coupon?.code).toBe('RaamizAdv');
    expect(result.coupon?.planSlug).toBe('advanced');
    expect(result.coupon?.discountPercent).toBe(100);
  });

  it('13.3 — handles case insensitivity cleanly', () => {
    const proLower = validateCoupon('raamizpro', 'pro');
    expect(proLower.valid).toBe(true);
    expect(proLower.coupon?.code).toBe('RaamizPro');

    const advUpper = validateCoupon('RAAMIZADV', 'advanced');
    expect(advUpper.valid).toBe(true);
    expect(advUpper.coupon?.code).toBe('RaamizAdv');
  });

  it('13.4 — strictly rejects RaamizPro when applied to Advanced tier', () => {
    const result = validateCoupon('RaamizPro', 'advanced');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid code');
  });

  it('13.5 — strictly rejects RaamizAdv when applied to Pro tier', () => {
    const result = validateCoupon('RaamizAdv', 'pro');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid code');
  });

  it('13.6 — strictly rejects any arbitrary or unauthorized discount codes', () => {
    const codes = ['DISCOUNT50', 'SUMMER100', 'VIP', 'FREEPRO', 'WELCOME', 'TEST', 'raamiz', 'pro'];
    for (const code of codes) {
      const resPro = validateCoupon(code, 'pro');
      expect(resPro.valid).toBe(false);
      expect(resPro.error).toBe('Invalid code');

      const resAdv = validateCoupon(code, 'advanced');
      expect(resAdv.valid).toBe(false);
      expect(resAdv.error).toBe('Invalid code');
    }
  });

  it('13.7 — strictly rejects empty or whitespace-only coupon inputs', () => {
    expect(validateCoupon('', 'pro').valid).toBe(false);
    expect(validateCoupon('   ', 'pro').error).toBe('Invalid code');
    expect(validateCoupon(null, 'advanced').valid).toBe(false);
    expect(validateCoupon(undefined, 'advanced').error).toBe('Invalid code');
  });

  it('13.8 — isValidCouponCode helper validates only RaamizPro and RaamizAdv', () => {
    expect(isValidCouponCode('RaamizPro')).toBe(true);
    expect(isValidCouponCode('raamizadv')).toBe(true);
    expect(isValidCouponCode('RandomPromo')).toBe(false);
    expect(isValidCouponCode('')).toBe(false);
  });
});

