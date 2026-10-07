// =============================================================================
// AI Radar — Server-Side Rate Limiter (Phase 7)
// =============================================================================
// Configurable sliding-window rate limiter protecting authentication,
// AI generation, briefings, search, and high-frequency endpoints.
// =============================================================================

import { RateLimitResult } from '@/lib/types';

interface WindowEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting: key -> WindowEntry
const rateLimitStore: Map<string, WindowEntry> = new Map();

// Default limits per minute by action
export const RATE_LIMIT_CONFIGS: Record<string, { maxRequests: number; windowMs: number }> = {
  auth: { maxRequests: 10, windowMs: 60_000 },
  ai_generation: { maxRequests: 20, windowMs: 60_000 },
  briefing: { maxRequests: 15, windowMs: 60_000 },
  search: { maxRequests: 40, windowMs: 60_000 },
  personalization: { maxRequests: 30, windowMs: 60_000 },
  general_api: { maxRequests: 100, windowMs: 60_000 },
};

/**
 * Checks and updates rate limit for a given identifier (IP or User ID) and action.
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMIT_CONFIGS | string = 'general_api',
  customLimit?: number,
  customWindowMs?: number
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[action] || { maxRequests: 60, windowMs: 60_000 };
  const maxRequests = customLimit ?? config.maxRequests;
  const windowMs = customWindowMs ?? config.windowMs;

  const key = `${action}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetMs: windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetMs: entry.resetAt - now,
      error: `Rate limit exceeded for ${action}. Please try again in ${Math.ceil((entry.resetAt - now) / 1000)} seconds.`,
    };
  }

  // Increment counter
  entry.count += 1;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    resetMs: entry.resetAt - now,
  };
}

/**
 * Clears rate limit store (useful in tests).
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}
