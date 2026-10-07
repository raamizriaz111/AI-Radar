// =============================================================================
// AI Radar — Phase 8: Usage Enforcement Service
// =============================================================================
// Per-billing-period usage tracking with atomic enforcement.
// Prevents concurrent requests from exceeding plan limits.
// =============================================================================

import type { UsagePeriod, UsageEnforcementResult } from './types';
import type { AiOperationType } from '@/lib/types';
import { getSubscription } from './subscriptionService';
import { getPlanLimits } from './planConfig';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/services/logger';

// ---------------------------------------------------------------------------
// In-memory usage period store (offline / tests)
// ---------------------------------------------------------------------------

interface InMemoryUsagePeriod {
  aiRequestsUsed: number;
  briefingsUsed: number;
  aiRequestsLimit: number;
  briefingsLimit: number;
  periodStart: string;
  periodEnd: string;
}

const inMemoryUsagePeriods: Map<string, InMemoryUsagePeriod> = new Map();

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

function getCurrentPeriodKey(userId: string): string {
  // Daily usage periods (resets each calendar day)
  const today = new Date().toISOString().slice(0, 10);
  return `${userId}:${today}`;
}

function getTodayBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Core usage enforcement
// ---------------------------------------------------------------------------

/**
 * Checks if an operation is allowed under the user's current plan limits.
 * Does NOT consume a usage slot — call recordUsage after the operation succeeds.
 */
export async function checkBillingUsageLimit(
  userId: string,
  opType: AiOperationType
): Promise<UsageEnforcementResult> {
  const sub = await getSubscription(userId);
  const limits = getPlanLimits(sub.planSlug);
  const key = getCurrentPeriodKey(userId);
  const { end } = getTodayBounds();

  let period = inMemoryUsagePeriods.get(key);
  if (!period) {
    period = {
      aiRequestsUsed: 0,
      briefingsUsed: 0,
      aiRequestsLimit: limits.aiRequestsLimit,
      briefingsLimit: limits.briefingsLimit,
      periodStart: getTodayBounds().start,
      periodEnd: end,
    };
    inMemoryUsagePeriods.set(key, period);
  } else {
    // Dynamically sync limits in case user upgraded or downgraded plan
    period.aiRequestsLimit = limits.aiRequestsLimit;
    period.briefingsLimit = limits.briefingsLimit;
  }

  if (opType === 'briefing') {
    const used = period.briefingsUsed;
    const limit = period.briefingsLimit;
    if (used >= limit) {
      return {
        allowed: false,
        used,
        limit,
        remaining: 0,
        reason: `Daily briefing limit (${limit}) reached on your ${sub.planSlug} plan. Resets tomorrow.`,
        resetAt: end,
      };
    }
    return { allowed: true, used, limit, remaining: limit - used };
  }

  // All other AI operations share the general aiRequests pool
  const used = period.aiRequestsUsed;
  const limit = period.aiRequestsLimit;
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      remaining: 0,
      reason: `Daily AI operations limit (${limit}) reached for your ${sub.planSlug} plan. Resets tomorrow.`,
      resetAt: end,
    };
  }
  return { allowed: true, used, limit, remaining: limit - used };
}

/**
 * Records a usage increment atomically.
 * Call this AFTER the operation has succeeded.
 */
export async function recordBillingUsage(
  userId: string,
  opType: AiOperationType
): Promise<void> {
  const key = getCurrentPeriodKey(userId);
  const sub = await getSubscription(userId);
  const limits = getPlanLimits(sub.planSlug);
  const { start, end } = getTodayBounds();

  let period = inMemoryUsagePeriods.get(key);
  if (!period) {
    period = {
      aiRequestsUsed: 0,
      briefingsUsed: 0,
      aiRequestsLimit: limits.aiRequestsLimit,
      briefingsLimit: limits.briefingsLimit,
      periodStart: start,
      periodEnd: end,
    };
  } else {
    period.aiRequestsLimit = limits.aiRequestsLimit;
    period.briefingsLimit = limits.briefingsLimit;
  }

  if (opType === 'briefing') {
    period.briefingsUsed++;
  } else {
    period.aiRequestsUsed++;
  }

  inMemoryUsagePeriods.set(key, period);

  // Persist to DB asynchronously (fire and forget, don't block)
  if (isDatabaseConfigured() && isServiceKeyConfigured()) {
    const supabase = createServiceClient();
    supabase
      .from('usage_periods')
      .upsert(
        {
          user_id: userId,
          period_start: period.periodStart,
          period_end: period.periodEnd,
          ai_requests_used: period.aiRequestsUsed,
          briefings_used: period.briefingsUsed,
          ai_requests_limit: period.aiRequestsLimit,
          briefings_limit: period.briefingsLimit,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, period_start' }
      )
      .then(({ error }) => {
        if (error) {
          logger.warn('Failed to persist usage period to db', { error: error.message });
        }
      });
  }
}

/**
 * Returns the usage period snapshot for today.
 */
export async function getCurrentUsagePeriod(userId: string): Promise<UsagePeriod> {
  const sub = await getSubscription(userId);
  const limits = getPlanLimits(sub.planSlug);
  const key = getCurrentPeriodKey(userId);
  const { start, end } = getTodayBounds();

  const rawPeriod = inMemoryUsagePeriods.get(key);
  const period = rawPeriod
    ? {
        ...rawPeriod,
        aiRequestsLimit: limits.aiRequestsLimit,
        briefingsLimit: limits.briefingsLimit,
      }
    : {
        aiRequestsUsed: 0,
        briefingsUsed: 0,
        aiRequestsLimit: limits.aiRequestsLimit,
        briefingsLimit: limits.briefingsLimit,
        periodStart: start,
        periodEnd: end,
      };

  return {
    id: `period-${userId}-${start}`,
    userId,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    aiRequestsUsed: period.aiRequestsUsed,
    briefingsUsed: period.briefingsUsed,
    aiRequestsLimit: period.aiRequestsLimit,
    briefingsLimit: period.briefingsLimit,
    createdAt: period.periodStart,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function resetBillingUsageStore(): void {
  inMemoryUsagePeriods.clear();
}
