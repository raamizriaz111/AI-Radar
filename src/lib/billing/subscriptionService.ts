// =============================================================================
// AI Radar — Phase 8: Subscription Service
// =============================================================================
// Manages subscription lifecycle: creation, retrieval, upgrades, cancellations.
// Uses both Supabase DB (when configured) and in-memory fallback for testing.
// =============================================================================

import type { Subscription, BillingEvent, BillingEventType } from './types';
import type { PlanSlug, BillingInterval } from './planConfig';
import { getPlanConfig, getPlanLimits, isValidPlanSlug } from './planConfig';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/services/logger';

// ---------------------------------------------------------------------------
// In-memory stores (offline mode / tests)
// ---------------------------------------------------------------------------

const inMemorySubscriptions: Map<string, Subscription> = new Map();
const inMemoryBillingEvents: BillingEvent[] = [];
let billingEventCounter = 0;

// Builder User IDs explicitly granted permanent Lifetime Advanced access
const builderUserIds = new Set<string>(['admin-passkey-user']);

/**
 * Registers a user ID as a recognized builder account.
 */
export function registerBuilderUserId(userId: string): void {
  if (userId) {
    builderUserIds.add(userId);
  }
}

/**
 * Checks if a given user ID belongs to the builder / owner account.
 */
export function isBuilderUserId(userId: string): boolean {
  if (!userId) return false;
  if (builderUserIds.has(userId)) return true;
  if (userId === 'admin-passkey-user' || userId.toLowerCase().includes('raamiz')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Default & Builder subscription factories
// ---------------------------------------------------------------------------

/**
 * Creates the permanent lifetime Advanced subscription for the builder.
 * Never expires, unlocked across all features.
 */
export function createBuilderLifetimeSubscription(userId: string): Subscription {
  const now = new Date().toISOString();
  return {
    id: `sub-builder-lifetime-${userId}`,
    userId,
    planSlug: 'advanced',
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: null, // Lifetime: never expires
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    billingInterval: 'none',
    provider: 'system_grant',
    providerSubscriptionId: 'builder_lifetime_grant',
    metadata: {
      isLifetimeGrant: true,
      grantedTo: 'raamizriaz111@gmail.com',
      tier: 'advanced',
      grantReason: 'System Owner & Builder Permanent Lifetime Access',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultSubscription(userId: string): Subscription {
  const now = new Date().toISOString();
  return {
    id: `sub-${userId}`,
    userId,
    planSlug: 'free',
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: null,
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    billingInterval: 'none',
    provider: null,
    providerSubscriptionId: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Ensures a builder account has their lifetime Advanced subscription persisted.
 */
export async function ensureBuilderSubscription(userId: string): Promise<Subscription> {
  registerBuilderUserId(userId);
  const lifetime = createBuilderLifetimeSubscription(userId);
  return upsertSubscription(lifetime);
}

// ---------------------------------------------------------------------------
// Subscription CRUD
// ---------------------------------------------------------------------------

/**
 * Gets the current subscription for a user.
 * Builder accounts automatically receive lifetime Advanced tier.
 * Public visitors and standard accounts receive the FREE subscription.
 */
export async function getSubscription(userId: string): Promise<Subscription> {
  // If user is recognized as builder, automatically grant permanent lifetime Advanced tier
  if (isBuilderUserId(userId)) {
    const cached = inMemorySubscriptions.get(userId);
    if (cached && cached.planSlug === 'advanced' && cached.status === 'active') {
      return cached;
    }
    const builderSub = createBuilderLifetimeSubscription(userId);
    inMemorySubscriptions.set(userId, builderSub);
    return builderSub;
  }

  const cached = inMemorySubscriptions.get(userId);
  if (cached) return cached;

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const sub: Subscription = mapDbSubscription(data);
        inMemorySubscriptions.set(userId, sub);
        return sub;
      }
    } catch (err) {
      logger.debug('Failed to fetch subscription from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  // Auto-create default FREE subscription for standard visitors
  const defaultSub = createDefaultSubscription(userId);
  inMemorySubscriptions.set(userId, defaultSub);
  return defaultSub;
}

/**
 * Creates or replaces a subscription for a user.
 */
export async function upsertSubscription(sub: Subscription): Promise<Subscription> {
  const updated: Subscription = { ...sub, updatedAt: new Date().toISOString() };
  inMemorySubscriptions.set(sub.userId, updated);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('subscriptions').upsert(
        {
          user_id: sub.userId,
          plan_slug: sub.planSlug,
          status: sub.status,
          current_period_start: sub.currentPeriodStart,
          current_period_end: sub.currentPeriodEnd,
          trial_start: sub.trialStart,
          trial_end: sub.trialEnd,
          cancel_at_period_end: sub.cancelAtPeriodEnd,
          canceled_at: sub.canceledAt,
          billing_interval: sub.billingInterval,
          provider: sub.provider,
          provider_subscription_id: sub.providerSubscriptionId,
          metadata: sub.metadata as any,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'user_id' }
      );

      // Sync user_plans table for legacy compatibility
      const limits = getPlanLimits(sub.planSlug);
      const config = getPlanConfig(sub.planSlug);
      await supabase.from('user_plans').upsert(
        {
          user_id: sub.userId,
          plan_tier: sub.planSlug,
          ai_requests_limit: limits.aiRequestsLimit,
          briefings_limit: limits.briefingsLimit,
          tracked_topics_limit: limits.trackedTopicsLimit,
          features: config.features as any,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      logger.warn('Failed to persist subscription to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return updated;
}

/**
 * Upgrades or downgrades a user's plan.
 */
export async function changePlan(
  userId: string,
  newPlanSlug: PlanSlug,
  billingInterval: BillingInterval = 'monthly',
  providerSubscriptionId?: string
): Promise<Subscription> {
  if (!isValidPlanSlug(newPlanSlug)) {
    throw new Error(`Invalid plan slug: ${newPlanSlug}`);
  }

  const current = await getSubscription(userId);
  const isUpgrade = getPlanConfig(newPlanSlug).sortOrder > getPlanConfig(current.planSlug).sortOrder;

  const now = new Date();
  const updated: Subscription = {
    ...current,
    planSlug: newPlanSlug,
    status: 'active',
    billingInterval: newPlanSlug === 'free' ? 'none' : billingInterval,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    providerSubscriptionId: providerSubscriptionId ?? current.providerSubscriptionId,
    updatedAt: now.toISOString(),
  };

  await upsertSubscription(updated);

  // Record audit event
  await recordBillingEvent({
    userId,
    eventType: isUpgrade ? 'plan.upgraded' : 'plan.downgraded',
    provider: current.provider ?? 'system',
    subscriptionId: current.id,
    rawPayload: {
      fromPlan: current.planSlug,
      toPlan: newPlanSlug,
      billingInterval,
    },
  });

  logger.info('Plan changed', { userId, from: current.planSlug, to: newPlanSlug });
  return updated;
}

/**
 * Cancels a subscription at period end.
 */
export async function cancelSubscription(userId: string): Promise<Subscription> {
  const current = await getSubscription(userId);
  const now = new Date().toISOString();

  const updated: Subscription = {
    ...current,
    cancelAtPeriodEnd: true,
    canceledAt: now,
    updatedAt: now,
  };

  await upsertSubscription(updated);

  await recordBillingEvent({
    userId,
    eventType: 'subscription.canceled',
    provider: current.provider ?? 'system',
    subscriptionId: current.id,
    rawPayload: { planSlug: current.planSlug },
  });

  return updated;
}

/**
 * Reactivates a subscription that was set to cancel at period end.
 */
export async function reactivateSubscription(userId: string): Promise<Subscription> {
  const current = await getSubscription(userId);
  const now = new Date().toISOString();

  const updated: Subscription = {
    ...current,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    updatedAt: now,
  };

  await upsertSubscription(updated);

  await recordBillingEvent({
    userId,
    eventType: 'subscription.updated',
    provider: current.provider ?? 'system',
    subscriptionId: current.id,
    rawPayload: { action: 'reactivated', planSlug: current.planSlug },
  });

  return updated;
}

/**
 * Marks a subscription as expired (called from webhook or reconciliation).
 */
export async function expireSubscription(userId: string): Promise<Subscription> {
  const current = await getSubscription(userId);
  const now = new Date().toISOString();

  const updated: Subscription = {
    ...current,
    planSlug: 'free',
    status: 'expired',
    cancelAtPeriodEnd: false,
    updatedAt: now,
  };

  await upsertSubscription(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Billing Event Audit Trail
// ---------------------------------------------------------------------------

export interface RecordBillingEventParams {
  userId: string | null;
  eventType: BillingEventType;
  provider?: string;
  providerEventId?: string;
  subscriptionId?: string | null;
  amountUsd?: number;
  currency?: string;
  rawPayload?: Record<string, unknown>;
  status?: 'processed' | 'failed' | 'ignored';
}

/**
 * Records an immutable billing event.
 * Idempotent on (provider, providerEventId) when providerEventId is provided.
 */
export async function recordBillingEvent(
  params: RecordBillingEventParams
): Promise<BillingEvent> {
  const now = new Date().toISOString();
  const event: BillingEvent = {
    id: `evt-${++billingEventCounter}-${Date.now()}`,
    userId: params.userId,
    eventType: params.eventType,
    provider: params.provider ?? null,
    providerEventId: params.providerEventId ?? null,
    subscriptionId: params.subscriptionId ?? null,
    amountUsd: params.amountUsd ?? null,
    currency: params.currency ?? 'usd',
    status: params.status ?? 'processed',
    rawPayload: params.rawPayload ?? {},
    processedAt: now,
    createdAt: now,
  };

  inMemoryBillingEvents.push(event);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('billing_events').insert({
        user_id: event.userId,
        event_type: event.eventType,
        provider: event.provider,
        provider_event_id: event.providerEventId,
        subscription_id: event.subscriptionId,
        amount_usd: event.amountUsd,
        currency: event.currency,
        status: event.status,
        raw_payload: event.rawPayload as any,
        processed_at: event.processedAt,
      });
    } catch (err) {
      logger.warn('Failed to persist billing event to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return event;
}

/**
 * Returns recent billing events for a user.
 */
export function getUserBillingEvents(userId: string, limit = 20): BillingEvent[] {
  return inMemoryBillingEvents
    .filter((e) => e.userId === userId)
    .slice(-limit)
    .reverse();
}

/**
 * Returns all billing events (admin use).
 */
export function getAllBillingEvents(limit = 100): BillingEvent[] {
  return inMemoryBillingEvents.slice(-limit).reverse();
}

// ---------------------------------------------------------------------------
// Admin billing summary
// ---------------------------------------------------------------------------

export function getBillingAdminSummary() {
  const subs = Array.from(inMemorySubscriptions.values());
  const byPlan: Record<string, number> = {};
  let activeCount = 0;
  let trialingCount = 0;
  let canceledCount = 0;
  let estimatedMrr = 0;

  for (const sub of subs) {
    byPlan[sub.planSlug] = (byPlan[sub.planSlug] ?? 0) + 1;
    if (sub.status === 'active') {
      activeCount++;
      const plan = getPlanConfig(sub.planSlug);
      estimatedMrr += sub.billingInterval === 'annual'
        ? (plan.priceAnnualUsd ?? plan.priceMonthlyUsd * 12) / 12
        : plan.priceMonthlyUsd;
    }
    if (sub.status === 'trialing') trialingCount++;
    if (sub.status === 'canceled' || sub.status === 'expired' || sub.cancelAtPeriodEnd) canceledCount++;
  }

  return {
    totalSubscriptions: subs.length,
    activeSubscriptions: activeCount,
    trialingSubscriptions: trialingCount,
    canceledSubscriptions: canceledCount,
    byPlan,
    recentEvents: getAllBillingEvents(10),
    estimatedMrr: Math.round(estimatedMrr * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function resetBillingStore(): void {
  inMemorySubscriptions.clear();
  inMemoryBillingEvents.length = 0;
  billingEventCounter = 0;
}

// ---------------------------------------------------------------------------
// DB row mapper
// ---------------------------------------------------------------------------

function mapDbSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    planSlug: (row['plan_slug'] as PlanSlug) ?? 'free',
    status: (row['status'] as Subscription['status']) ?? 'active',
    currentPeriodStart: (row['current_period_start'] as string) ?? null,
    currentPeriodEnd: (row['current_period_end'] as string) ?? null,
    trialStart: (row['trial_start'] as string) ?? null,
    trialEnd: (row['trial_end'] as string) ?? null,
    cancelAtPeriodEnd: Boolean(row['cancel_at_period_end']),
    canceledAt: (row['canceled_at'] as string) ?? null,
    billingInterval: (row['billing_interval'] as BillingInterval) ?? 'none',
    provider: (row['provider'] as string) ?? null,
    providerSubscriptionId: (row['provider_subscription_id'] as string) ?? null,
    metadata: (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}
