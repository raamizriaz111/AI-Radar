// =============================================================================
// AI Radar — Trend Lifecycle & Confidence Rules (Phase 5)
// =============================================================================
// Transparent, deterministic rules for trend lifecycle transitions and
// confidence scoring. No black-box magic; every transition has an explicit rule.
// =============================================================================

import type { TrendStatus, TrendConfidence } from '@/lib/database.types';

export interface LifecycleEvaluationInput {
  itemCount: number;
  distinctSourceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  activityChangePct?: number;
  hasContradictions?: boolean;
}

export interface LifecycleEvaluationResult {
  status: TrendStatus;
  confidence: TrendConfidence;
  confidenceScore: number;
  statusReason: string;
  confidenceReason: string;
}

/**
 * Evaluates the lifecycle status of a trend candidate according to documented rules:
 *
 * - early_signal: 1-2 distinct sources, initial items (>= 2 or single emerging topic),
 *                 recent first seen (< 14 days ago).
 * - developing:   >= 2 distinct sources, >= 3 items, sustained activity or accelerating velocity.
 * - established:  >= 3 distinct sources, >= 5 items, active over at least 14 days.
 * - uncertain:    Contradictory evidence detected (e.g. benchmark regressions, flaws)
 *                 OR high variance with single-source reliance.
 * - declining:    No new items in recent 14-30 days while previously active.
 * - inactive:     No new items in > 30 days.
 */
export function evaluateTrendLifecycle(input: LifecycleEvaluationInput): LifecycleEvaluationResult {
  const {
    itemCount,
    distinctSourceCount,
    firstSeenAt,
    lastSeenAt,
    activityChangePct = 0,
    hasContradictions = false,
  } = input;

  const now = new Date().getTime();
  const firstSeenMs = new Date(firstSeenAt).getTime();
  const lastSeenMs = new Date(lastSeenAt).getTime();

  const daysSinceFirstSeen = Math.max(0, (now - firstSeenMs) / (1000 * 60 * 60 * 24));
  const daysSinceLastSeen = Math.max(0, (now - lastSeenMs) / (1000 * 60 * 60 * 24));
  const lifespanDays = Math.max(0, (lastSeenMs - firstSeenMs) / (1000 * 60 * 60 * 24));

  // 1. Determine Status
  let status: TrendStatus;
  let statusReason: string;

  if (hasContradictions) {
    status = 'uncertain';
    statusReason = 'Contradictory evidence, benchmark disputes, or limitations reported in source items.';
  } else if (daysSinceLastSeen > 30) {
    status = 'inactive';
    statusReason = `No new activity detected in ${Math.round(daysSinceLastSeen)} days (dormant).`;
  } else if (daysSinceLastSeen > 14 && itemCount >= 3) {
    status = 'declining';
    statusReason = `Activity quieted over the last ${Math.round(daysSinceLastSeen)} days after initial coverage.`;
  } else if (distinctSourceCount >= 3 && itemCount >= 5 && (lifespanDays >= 14 || daysSinceFirstSeen >= 14)) {
    status = 'established';
    statusReason = `Confirmed by ${distinctSourceCount} independent sources across ${itemCount} developments over ${Math.round(lifespanDays)} days.`;
  } else if (distinctSourceCount >= 2 && itemCount >= 3) {
    status = 'developing';
    statusReason = `Accelerating across ${distinctSourceCount} distinct sources with ${itemCount} items (${activityChangePct >= 0 ? '+' : ''}${Math.round(activityChangePct)}% velocity).`;
  } else {
    status = 'early_signal';
    statusReason = `Early signal observed across ${itemCount} item(s) from ${distinctSourceCount} source(s).`;
  }

  // 2. Determine Confidence
  // Multi-source confirmation is paramount:
  // - Distinct sources (max 0.40 pts)
  // - Volume of items (max 0.30 pts)
  // - Temporal span / consistency (max 0.20 pts)
  // - Velocity bonus (max 0.10 pts)
  // - Contradiction penalty (-0.15 pts)

  let score = 0;

  // Source diversity factor (40%)
  if (distinctSourceCount >= 3) score += 0.40;
  else if (distinctSourceCount === 2) score += 0.25;
  else score += 0.10;

  // Item volume factor (30%)
  if (itemCount >= 7) score += 0.30;
  else if (itemCount >= 4) score += 0.20;
  else if (itemCount >= 2) score += 0.10;
  else score += 0.05;

  // Temporal consistency factor (20%)
  if (lifespanDays >= 14) score += 0.20;
  else if (lifespanDays >= 5) score += 0.12;
  else score += 0.05;

  // Activity velocity factor (10%)
  if (activityChangePct > 20) score += 0.10;
  else if (activityChangePct > 0) score += 0.05;

  // Contradiction adjustment
  if (hasContradictions) {
    score = Math.max(0.15, score - 0.20);
  }

  // Strict Single-Source Rule: Without independent corroboration, confidence is low
  if (distinctSourceCount <= 1) {
    score = Math.min(score, 0.35);
  }

  // Bound between 0 and 1
  const confidenceScore = Math.min(Math.max(Number(score.toFixed(2)), 0.05), 0.98);

  let confidence: TrendConfidence;
  let confidenceReason: string;

  if (confidenceScore >= 0.70) {
    confidence = 'high';
    confidenceReason = `High confidence: Multi-source corroboration (${distinctSourceCount} sources) and strong item volume (${itemCount} items).`;
  } else if (confidenceScore >= 0.40) {
    confidence = 'medium';
    confidenceReason = `Medium confidence: Developing signal with ${distinctSourceCount} source(s); awaiting further independent confirmations.`;
  } else {
    confidence = 'low';
    confidenceReason = `Low confidence: Limited source diversity (${distinctSourceCount} source) or early emerging stage.`;
  }

  return {
    status,
    confidence,
    confidenceScore,
    statusReason,
    confidenceReason,
  };
}
