// =============================================================================
// AI Radar — Explicit User Preferences & Relevance (Phase 5)
// =============================================================================
// Lightweight, transparent user preference model.
// Never infers sensitive or political traits. Uses explicit topic selections.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/services/logger';
import type { ItemFull } from '@/lib/database.types';
import type { UserPreferences } from '@/lib/types';
import { DEFAULT_PREFERENCES } from './types';

export { DEFAULT_PREFERENCES };

// In-memory fallback cache for dev / single-user mode
let inMemoryPreferences: UserPreferences = { ...DEFAULT_PREFERENCES };

/**
 * Retrieves the current user's explicit topic and category preferences.
 */
export async function getUserPreferences(userId?: string): Promise<UserPreferences> {
  if (!isDatabaseConfigured()) {
    return inMemoryPreferences;
  }

  try {
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { getCurrentUser } = await import('@/lib/auth/session');
      const user = await getCurrentUser();
      effectiveUserId = user?.id;
    }

    if (!effectiveUserId) {
      return inMemoryPreferences;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', effectiveUserId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return inMemoryPreferences;
    }

    return {
      topics: Array.isArray(data.topics) ? (data.topics as string[]) : DEFAULT_PREFERENCES.topics,
      categories: Array.isArray(data.categories) ? (data.categories as any[]) : DEFAULT_PREFERENCES.categories,
      interestLevel: (data.interest_level as Record<string, 'high' | 'medium' | 'low'>) ?? DEFAULT_PREFERENCES.interestLevel,
    };
  } catch (err) {
    logger.warn('Failed to load user preferences from DB, using fallback', {
      error: err instanceof Error ? err.message : String(err),
    });
    return inMemoryPreferences;
  }
}

/**
 * Updates explicit user preferences.
 */
export async function saveUserPreferences(prefs: UserPreferences, userId?: string): Promise<boolean> {
  inMemoryPreferences = { ...prefs };

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    return true;
  }

  try {
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { getCurrentUser } = await import('@/lib/auth/session');
      const user = await getCurrentUser();
      effectiveUserId = user?.id;
    }

    // If user is in guest / demo session without Supabase auth, memory update is sufficient
    if (!effectiveUserId) {
      return true;
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('user_preferences')
      .upsert(
        {
          user_id: effectiveUserId,
          topics: prefs.topics as any,
          categories: prefs.categories as any,
          interest_level: prefs.interestLevel as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      if (error.message && (error.message.includes('relation') || error.message.includes('foreign key'))) {
        logger.warn('user_preferences table missing or detached. Saved in memory.');
        return true;
      }
      logger.error('Failed to save user preferences to DB', error);
      return false;
    }

    return true;
  } catch (err) {
    logger.error('Unexpected error saving user preferences', err);
    return false;
  }
}

/**
 * Calculates a transparent user relevance score (0.0 to 1.0) and matched topics
 * for an item based on the user's explicit topic preferences.
 */
export function computeUserRelevance(
  item: ItemFull,
  preferences: UserPreferences
): { score: number; matchedTopics: string[]; reason?: string } {
  const itemText = `${item.title} ${item.description ?? ''}`.toLowerCase();
  const summary = item.summary;
  const itemTopics = Array.isArray(summary?.topics) ? (summary.topics as string[]) : [];
  const itemTech = Array.isArray(summary?.technologies) ? (summary.technologies as string[]) : [];

  const matched: string[] = [];

  for (const topic of preferences.topics) {
    const lowerTopic = topic.toLowerCase();
    const inText = itemText.includes(lowerTopic);
    const inTopics = itemTopics.some((t) => t.toLowerCase().includes(lowerTopic));
    const inTech = itemTech.some((t) => t.toLowerCase().includes(lowerTopic));

    if (inText || inTopics || inTech) {
      matched.push(topic);
    }
  }

  // Also check category match
  const itemCategorySlugs = (item.categories || []).map((c) => c.slug);
  const matchedCategories = preferences.categories.filter((c) => itemCategorySlugs.includes(c));

  let score = 0;
  if (matched.length > 0) score += Math.min(matched.length * 0.35, 0.7);
  if (matchedCategories.length > 0) score += 0.3;

  score = Math.min(Math.max(score, 0), 1.0);

  const reason = matched.length > 0
    ? `Relevant because you follow ${matched.slice(0, 2).join(' & ')}`
    : undefined;

  return {
    score,
    matchedTopics: matched,
    reason,
  };
}
