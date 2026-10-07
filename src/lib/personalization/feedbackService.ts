// =============================================================================
// AI Radar — User Feedback & Interaction Service (Phase 7 Multi-User)
// =============================================================================
// Handles user interactions (useful, not_relevant, already_know, dismissed, saved)
// across intelligence items, skill gaps, project opportunities, and topics.
// Strictly isolates feedback per user ID to prevent cross-user contamination.
// =============================================================================

import { UserIntelligenceFeedback } from './types';

// In-memory cache for feedback events: `${userId}:${entityType}:${entityId}:${feedbackType}` -> feedback
const inMemoryFeedbackCache: Map<string, UserIntelligenceFeedback> = new Map();

function buildFeedbackKey(feedback: UserIntelligenceFeedback): string {
  const userPrefix = feedback.userId || 'default';
  return `${userPrefix}:${feedback.entityType}:${feedback.entityId}:${feedback.feedbackType}`;
}

/**
 * Records a user feedback event in memory.
 */
export function recordFeedbackInMemory(feedback: UserIntelligenceFeedback): void {
  const key = buildFeedbackKey(feedback);
  inMemoryFeedbackCache.set(key, {
    ...feedback,
    createdAt: feedback.createdAt || new Date().toISOString(),
  });
}

/**
 * Returns active feedback in memory for a specific user (or default user).
 */
export function getInMemoryFeedback(userId?: string | null): UserIntelligenceFeedback[] {
  const allFeedback = Array.from(inMemoryFeedbackCache.values());
  if (userId) {
    return allFeedback.filter((fb) => fb.userId === userId);
  }
  return allFeedback;
}

/**
 * Clears the in-memory feedback cache (for all users, or for a specific user).
 */
export function clearInMemoryFeedback(userId?: string | null): void {
  if (!userId) {
    inMemoryFeedbackCache.clear();
    return;
  }
  const prefix = `${userId}:`;
  for (const key of inMemoryFeedbackCache.keys()) {
    if (key.startsWith(prefix)) {
      inMemoryFeedbackCache.delete(key);
    }
  }
}

/**
 * Checks if an entity has been dismissed by a user.
 */
export function isEntityDismissed(
  entityType: UserIntelligenceFeedback['entityType'],
  entityId: string,
  feedbackList?: UserIntelligenceFeedback[],
  userId?: string | null
): boolean {
  const list = feedbackList || getInMemoryFeedback(userId);
  return list.some(
    (fb) =>
      (!userId || fb.userId === userId || !fb.userId) &&
      fb.entityType === entityType &&
      fb.entityId === entityId &&
      fb.feedbackType === 'dismissed'
  );
}

/**
 * Checks if an entity has been saved by a user.
 */
export function isEntitySaved(
  entityType: UserIntelligenceFeedback['entityType'],
  entityId: string,
  feedbackList?: UserIntelligenceFeedback[],
  userId?: string | null
): boolean {
  const list = feedbackList || getInMemoryFeedback(userId);
  return list.some(
    (fb) =>
      (!userId || fb.userId === userId || !fb.userId) &&
      fb.entityType === entityType &&
      fb.entityId === entityId &&
      fb.feedbackType === 'saved'
  );
}

/**
 * Filters out dismissed items for a specific user from an array of entities.
 */
export function filterDismissed<T extends { id: string }>(
  items: T[],
  entityType: UserIntelligenceFeedback['entityType'],
  feedbackList?: UserIntelligenceFeedback[],
  userId?: string | null
): T[] {
  const list = feedbackList || getInMemoryFeedback(userId);
  const dismissedIds = new Set(
    list
      .filter((fb) => (!userId || fb.userId === userId || !fb.userId) && fb.entityType === entityType && fb.feedbackType === 'dismissed')
      .map((fb) => fb.entityId)
  );

  return items.filter((item) => !dismissedIds.has(item.id));
}
