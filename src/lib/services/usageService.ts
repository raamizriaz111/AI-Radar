// =============================================================================
// AI Radar — Usage Control & Telemetry Service (Phase 7)
// =============================================================================
// Manages commercial plans, enforces daily/monthly AI allowances,
// and logs AI operation telemetry (tokens, model, cost estimation).
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { UserPlan, AiUsageLog, AiOperationType } from '@/lib/types';
import { logger } from '@/lib/services/logger';
import { getPlanConfig } from '@/lib/billing/planConfig';

const freeConfig = getPlanConfig('free');

// Default Free Plan settings derived directly from canonical planConfig
export const DEFAULT_FREE_PLAN: Omit<UserPlan, 'id' | 'userId'> = {
  planTier: 'free',
  aiRequestsLimit: freeConfig.limits.aiRequestsLimit,
  briefingsLimit: freeConfig.limits.briefingsLimit,
  trackedTopicsLimit: freeConfig.limits.trackedTopicsLimit,
  features: {
    customTopics: freeConfig.features.customTopics,
    export: freeConfig.features.export,
    earlyTrends: freeConfig.features.earlyTrends,
  },
};

// In-memory fallback stores for testing & offline mode
const inMemoryPlans: Map<string, UserPlan> = new Map();
const inMemoryUsageLogs: AiUsageLog[] = [];

/**
 * Retrieves the user's plan.
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const cached = inMemoryPlans.get(userId);
  if (cached) return cached;

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const plan: UserPlan = {
          id: data.id,
          userId: data.user_id,
          planTier: data.plan_tier,
          aiRequestsLimit: data.ai_requests_limit,
          briefingsLimit: data.briefings_limit,
          trackedTopicsLimit: data.tracked_topics_limit,
          features: (data.features || {}) as UserPlan['features'],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        inMemoryPlans.set(userId, plan);
        return plan;
      }
    } catch (err) {
      logger.debug('Failed to fetch user plan from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  // Create default in-memory plan
  const defaultPlan: UserPlan = {
    id: `plan-${userId}`,
    userId,
    ...DEFAULT_FREE_PLAN,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryPlans.set(userId, defaultPlan);
  return defaultPlan;
}

/**
 * Updates a user's plan tier or limits.
 */
export async function updateUserPlan(
  userId: string,
  updates: Partial<Omit<UserPlan, 'id' | 'userId'>>
): Promise<UserPlan> {
  const current = await getUserPlan(userId);
  const updated: UserPlan = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  inMemoryPlans.set(userId, updated);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('user_plans').upsert(
        {
          user_id: userId,
          plan_tier: updated.planTier,
          ai_requests_limit: updated.aiRequestsLimit,
          briefings_limit: updated.briefingsLimit,
          tracked_topics_limit: updated.trackedTopicsLimit,
          features: updated.features as any,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      logger.warn('Failed to persist user plan update to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return updated;
}

/**
 * Records an AI usage event for telemetry and cost control.
 */
export async function logAiUsage(
  log: Omit<AiUsageLog, 'id' | 'createdAt'>
): Promise<AiUsageLog> {
  const fullLog: AiUsageLog = {
    ...log,
    id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  inMemoryUsageLogs.push(fullLog);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('ai_usage_logs').insert({
        user_id: log.userId || null,
        operation_type: log.operationType,
        provider: log.provider,
        model: log.model,
        prompt_version: log.promptVersion || null,
        tokens_used: log.tokensUsed,
        is_cached: log.isCached,
        status: log.status,
        cost_estimate_usd: log.costEstimateUsd,
        metadata: (log.metadata || {}) as any,
      });
    } catch (err) {
      logger.warn('Failed to persist AI usage log to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return fullLog;
}

/**
 * Checks if the user is within their plan usage limits for a given operation.
 */
export async function checkUsageLimit(
  userId: string,
  opType: AiOperationType
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const plan = await getUserPlan(userId);

  // Count user's operations today
  const today = new Date().toISOString().slice(0, 10);
  const userTodayLogs = inMemoryUsageLogs.filter(
    (l) => l.userId === userId && l.createdAt.startsWith(today)
  );

  const totalToday = userTodayLogs.length;

  if (opType === 'briefing') {
    const briefingCount = userTodayLogs.filter((l) => l.operationType === 'briefing').length;
    if (briefingCount >= plan.briefingsLimit) {
      return {
        allowed: false,
        remaining: 0,
        reason: `Daily personalized briefing generation limit (${plan.briefingsLimit}) reached on your ${plan.planTier} plan.`,
      };
    }
    return {
      allowed: true,
      remaining: plan.briefingsLimit - briefingCount,
    };
  }

  if (totalToday >= plan.aiRequestsLimit) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Daily AI operations limit (${plan.aiRequestsLimit}) reached for your ${plan.planTier} plan. Resets tomorrow.`,
    };
  }

  return {
    allowed: true,
    remaining: plan.aiRequestsLimit - totalToday,
  };
}

/**
 * Returns aggregated usage metrics for a user.
 */
export async function getUserUsageMetrics(userId: string): Promise<{
  plan: UserPlan;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  todayRequests: number;
  recentLogs: AiUsageLog[];
}> {
  const plan = await getUserPlan(userId);
  const today = new Date().toISOString().slice(0, 10);

  const userLogs = inMemoryUsageLogs.filter((l) => l.userId === userId);
  const todayLogs = userLogs.filter((l) => l.createdAt.startsWith(today));

  const totalTokens = userLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0);
  const totalCostUsd = userLogs.reduce((sum, l) => sum + (l.costEstimateUsd || 0), 0);

  return {
    plan,
    totalRequests: userLogs.length,
    totalTokens,
    totalCostUsd,
    todayRequests: todayLogs.length,
    recentLogs: userLogs.slice(-10).reverse(),
  };
}

/**
 * Returns global usage telemetry for diagnostics.
 */
export function getGlobalUsageMetrics(): {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  activeUsersCount: number;
} {
  const uniqueUsers = new Set(inMemoryUsageLogs.map((l) => l.userId).filter(Boolean));
  const totalTokens = inMemoryUsageLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0);
  const totalCostUsd = inMemoryUsageLogs.reduce((sum, l) => sum + (l.costEstimateUsd || 0), 0);

  return {
    totalRequests: inMemoryUsageLogs.length,
    totalTokens,
    totalCostUsd,
    activeUsersCount: uniqueUsers.size,
  };
}

/**
 * Clears in-memory usage stores (for tests).
 */
export function resetUsageStore(): void {
  inMemoryPlans.clear();
  inMemoryUsageLogs.length = 0;
}
