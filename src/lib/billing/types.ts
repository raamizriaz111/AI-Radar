// =============================================================================
// AI Radar — Phase 8: Billing Types
// =============================================================================

import type { PlanSlug, BillingInterval, PlanConfig } from './planConfig';
export type { PlanSlug, BillingInterval };

// ---------------------------------------------------------------------------
// Subscription status lifecycle
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'paused'
  | 'incomplete';

// ---------------------------------------------------------------------------
// Subscription record
// ---------------------------------------------------------------------------

export interface Subscription {
  id: string;
  userId: string;
  planSlug: PlanSlug;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  billingInterval: BillingInterval;
  provider: string | null;
  providerSubscriptionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Billing customer record
// ---------------------------------------------------------------------------

export interface BillingCustomer {
  id: string;
  userId: string;
  provider: string;
  providerCustomerId: string;
  email: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Billing event (immutable audit log entry)
// ---------------------------------------------------------------------------

export type BillingEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.expired'
  | 'subscription.trial_started'
  | 'subscription.trial_ended'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'customer.created'
  | 'checkout.completed'
  | 'plan.upgraded'
  | 'plan.downgraded'
  | 'usage.limit_reached'
  | 'webhook.received'
  | 'webhook.processed'
  | 'webhook.failed';

export interface BillingEvent {
  id: string;
  userId: string | null;
  eventType: BillingEventType;
  provider: string | null;
  providerEventId: string | null;
  subscriptionId: string | null;
  amountUsd: number | null;
  currency: string;
  status: 'processed' | 'failed' | 'ignored';
  rawPayload: Record<string, unknown>;
  processedAt: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Invoice record
// ---------------------------------------------------------------------------

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string | null;
  provider: string;
  providerInvoiceId: string | null;
  amountDueUsd: number;
  amountPaidUsd: number;
  currency: string;
  status: InvoiceStatus;
  invoiceUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Usage period snapshot
// ---------------------------------------------------------------------------

export interface UsagePeriod {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  aiRequestsUsed: number;
  briefingsUsed: number;
  aiRequestsLimit: number;
  briefingsLimit: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Feature access result
// ---------------------------------------------------------------------------

export interface FeatureAccessResult {
  allowed: boolean;
  planSlug: PlanSlug;
  reason?: string;
  upgradeRequired?: PlanSlug;
}

// ---------------------------------------------------------------------------
// Usage enforcement result
// ---------------------------------------------------------------------------

export interface UsageEnforcementResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  reason?: string;
  resetAt?: string;
}

// ---------------------------------------------------------------------------
// Checkout session
// ---------------------------------------------------------------------------

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
}

// ---------------------------------------------------------------------------
// Billing portal
// ---------------------------------------------------------------------------

export interface BillingPortalResult {
  portalUrl: string;
  provider: string;
}

// ---------------------------------------------------------------------------
// Plan with subscription context (for UI)
// ---------------------------------------------------------------------------

export interface UserBillingContext {
  plan: PlanConfig;
  subscription: Subscription;
  usagePeriod: UsagePeriod | null;
  recentInvoices: Invoice[];
}

// ---------------------------------------------------------------------------
// Admin billing summary
// ---------------------------------------------------------------------------

export interface AdminBillingSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  byPlan: Record<string, number>;
  recentEvents: BillingEvent[];
  estimatedMrr: number;
}
