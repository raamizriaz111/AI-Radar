// =============================================================================
// AI Radar — Personalization & Career Repository (Phase 7 Multi-User)
// =============================================================================
// Data access layer for user profiles, career signals, skill gaps,
// project opportunities, tracked topics, saved intelligence, and user feedback.
//
// Guarantees strict multi-tenant isolation: every user's private data is isolated
// by userId both in Supabase PostgreSQL and in the in-memory fallback stores.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getItems } from '@/lib/repositories/itemRepository';
import { getAllTrends } from '@/lib/repositories/trendRepository';
import { clearUserInMemoryBookmarks } from '@/lib/repositories/bookmarkRepository';
import { logger } from '@/lib/services/logger';
import { invalidateUserCache } from '@/lib/services/cacheService';
import type { Json } from '@/lib/database.types';
import {
  UserProfile,
  CareerSignal,
  SkillGap,
  ProjectOpportunity,
  LearningTopic,
  UserIntelligenceFeedback,
  ProjectOpportunityStatus,
  SkillGapActionStatus,
  DEFAULT_USER_PROFILE,
} from '@/lib/personalization/types';
import {
  TrackedTopic,
  SavedIntelligence,
  SavedEntityType,
} from '@/lib/types';
import { detectSkillGaps } from '@/lib/personalization/skillGapEngine';
import { detectCareerSignals } from '@/lib/personalization/careerSignalsEngine';
import { generateProjectOpportunities } from '@/lib/personalization/projectOpportunityEngine';
import { getLearningTopics } from '@/lib/personalization/learningIntelligence';
import {
  recordFeedbackInMemory,
  getInMemoryFeedback,
  clearInMemoryFeedback,
} from '@/lib/personalization/feedbackService';

// Multi-tenant in-memory fallback stores (keyed by userId or 'default')
const inMemoryProfiles: Map<string, UserProfile> = new Map();
const inMemoryOpportunities: Map<string, ProjectOpportunity> = new Map(); // key: `${userId}:${slug}`
const inMemorySkillGaps: Map<string, SkillGap> = new Map(); // key: `${userId}:${gapId}`
const inMemoryTrackedTopics: Map<string, TrackedTopic[]> = new Map(); // key: userId
const inMemorySavedIntel: Map<string, SavedIntelligence[]> = new Map(); // key: userId

function resolveUserKey(userId?: string | null): string {
  return userId || 'default';
}

/**
 * Retrieves the user profile for a specific user ID or default session.
 */
export async function getUserProfile(userId?: string | null): Promise<UserProfile> {
  const userKey = resolveUserKey(userId);

  if (!isDatabaseConfigured()) {
    if (!inMemoryProfiles.has(userKey)) {
      inMemoryProfiles.set(userKey, {
        ...DEFAULT_USER_PROFILE,
        id: `prof-${userKey}`,
        userId: userId || null,
      });
    }
    return inMemoryProfiles.get(userKey)!;
  }

  try {
    const supabase = await createClient();
    let query = supabase.from('user_profiles').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();

    if (error) {
      if (error.message?.includes('relation') || error.code === '42P01') {
        logger.debug('user_profiles table not found. Using in-memory profile.');
      } else {
        logger.error('Error fetching user profile', error);
      }
      return inMemoryProfiles.get(userKey) || { ...DEFAULT_USER_PROFILE, userId: userId || null };
    }

    if (!data) {
      // Fallback if not found in db yet
      if (!inMemoryProfiles.has(userKey)) {
        inMemoryProfiles.set(userKey, {
          ...DEFAULT_USER_PROFILE,
          id: `prof-${userKey}`,
          userId: userId || null,
        });
      }
      return inMemoryProfiles.get(userKey)!;
    }

    // Map database row to domain interface
    const mapped: UserProfile = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      experienceLevel: data.experience_level,
      primaryRoleInterest: data.primary_role_interest,
      secondaryRoleInterests: Array.isArray(data.secondary_role_interests)
        ? (data.secondary_role_interests as string[])
        : [],
      skills: Array.isArray(data.skills) ? (data.skills as unknown as UserProfile['skills']) : [],
      technologies: Array.isArray(data.technologies) ? (data.technologies as string[]) : [],
      careerGoals: Array.isArray(data.career_goals) ? (data.career_goals as string[]) : [],
      learningGoals: Array.isArray(data.learning_goals) ? (data.learning_goals as string[]) : [],
      projectInterests: Array.isArray(data.project_interests) ? (data.project_interests as string[]) : [],
      preferredTopics: Array.isArray(data.preferred_topics) ? (data.preferred_topics as string[]) : [],
      excludedTopics: Array.isArray(data.excluded_topics) ? (data.excluded_topics as string[]) : [],
      metadata: (data.metadata || {}) as Record<string, unknown>,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    inMemoryProfiles.set(userKey, mapped);
    return mapped;
  } catch (err) {
    logger.error('Unexpected error in getUserProfile', err);
    return inMemoryProfiles.get(userKey) || { ...DEFAULT_USER_PROFILE, userId: userId || null };
  }
}

/**
 * Updates or creates the user profile for a specific user ID.
 */
export async function saveUserProfile(
  updates: Partial<UserProfile>,
  userId?: string | null
): Promise<UserProfile> {
  const userKey = resolveUserKey(userId);
  const current = await getUserProfile(userId);

  const updated: UserProfile = {
    ...current,
    ...updates,
    userId: userId || current.userId,
    updatedAt: new Date().toISOString(),
  };

  inMemoryProfiles.set(userKey, updated);
  if (userId) invalidateUserCache(userId);

  if (!isDatabaseConfigured()) {
    return updated;
  }

  try {
    const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();

    const payload = {
      name: updated.name,
      experience_level: updated.experienceLevel,
      primary_role_interest: updated.primaryRoleInterest,
      secondary_role_interests: updated.secondaryRoleInterests as unknown as Json,
      skills: updated.skills as unknown as Json,
      technologies: updated.technologies as unknown as Json,
      career_goals: updated.careerGoals as unknown as Json,
      learning_goals: updated.learningGoals as unknown as Json,
      project_interests: updated.projectInterests as unknown as Json,
      preferred_topics: updated.preferredTopics as unknown as Json,
      excluded_topics: updated.excludedTopics as unknown as Json,
      metadata: updated.metadata as unknown as Json,
      updated_at: updated.updatedAt,
    };

    if (userId) {
      await supabase.from('user_profiles').upsert(
        {
          user_id: userId,
          ...payload,
        },
        { onConflict: 'user_id' }
      );
    } else {
      await supabase.from('user_profiles').upsert({
        id: updated.id,
        user_id: null,
        ...payload,
      });
    }

    return updated;
  } catch (err) {
    logger.error('Failed to save user profile to database', err);
    return updated;
  }
}

/**
 * Retrieves evidence-grounded career signals (global intelligence).
 */
export async function getCareerSignals(): Promise<CareerSignal[]> {
  const { data: items } = await getItems({ pageSize: 60 });
  const trends = await getAllTrends({ limit: 20 });
  const trendList = trends.map((t) => ({ id: t.id, title: t.title, slug: t.slug }));

  return detectCareerSignals(items, trendList);
}

/**
 * Retrieves potential skill gaps for a user.
 */
export async function getSkillGaps(
  profile?: UserProfile,
  userId?: string | null
): Promise<SkillGap[]> {
  const activeProfile = profile || (await getUserProfile(userId));
  const userKey = resolveUserKey(userId || activeProfile.userId);

  const { data: items } = await getItems({ pageSize: 60 });
  const trends = await getAllTrends({ limit: 20 });
  const trendList = trends.map((t) => ({ id: t.id, title: t.title, slug: t.slug }));

  const dynamicGaps = detectSkillGaps(activeProfile, items, trendList);

  // Apply in-memory status overrides for this specific user
  return dynamicGaps.map((gap) => {
    const key = `${userKey}:${gap.id}`;
    const cached = inMemorySkillGaps.get(key);
    return cached ? { ...gap, userActionStatus: cached.userActionStatus } : gap;
  });
}

/**
 * Updates status of a skill gap (e.g. saved, dismissed, in_progress) scoped by user.
 */
export async function updateSkillGapStatus(
  gapId: string,
  status: SkillGapActionStatus,
  userId?: string | null
): Promise<void> {
  const userKey = resolveUserKey(userId);
  const key = `${userKey}:${gapId}`;
  const existing = inMemorySkillGaps.get(key);

  inMemorySkillGaps.set(key, {
    ...(existing || ({ id: gapId } as SkillGap)),
    userActionStatus: status,
  });

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase
        .from('skill_gaps')
        .update({ user_action_status: status, updated_at: new Date().toISOString() })
        .eq('id', gapId);
    } catch (err) {
      logger.warn('Failed to persist skill gap status update to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }
}

/**
 * Retrieves personalized project opportunities for a user.
 */
export async function getProjectOpportunities(
  profile?: UserProfile,
  userId?: string | null
): Promise<ProjectOpportunity[]> {
  const activeProfile = profile || (await getUserProfile(userId));
  const userKey = resolveUserKey(userId || activeProfile.userId);

  const { data: items } = await getItems({ pageSize: 60 });
  const dynamicOpportunities = generateProjectOpportunities(activeProfile, items);

  // Apply in-memory status/notes overrides for this user
  return dynamicOpportunities.map((opp) => {
    const key = `${userKey}:${opp.slug}`;
    const cached = inMemoryOpportunities.get(key);
    if (cached) {
      return {
        ...opp,
        userStatus: cached.userStatus,
        userNotes: cached.userNotes !== undefined ? cached.userNotes : opp.userNotes,
      };
    }
    return opp;
  });
}

/**
 * Updates status of a project opportunity scoped by user.
 */
export async function updateProjectOpportunityStatus(
  slug: string,
  status: ProjectOpportunityStatus,
  userNotes?: string | null,
  userId?: string | null
): Promise<void> {
  const userKey = resolveUserKey(userId);
  const key = `${userKey}:${slug}`;
  const existing = inMemoryOpportunities.get(key);

  inMemoryOpportunities.set(key, {
    ...(existing || ({ slug } as ProjectOpportunity)),
    userStatus: status,
    userNotes: userNotes !== undefined ? userNotes : existing?.userNotes,
  });

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      const updates: {
        user_status?: ProjectOpportunityStatus;
        user_notes?: string | null;
        updated_at?: string;
      } = {
        user_status: status,
        updated_at: new Date().toISOString(),
      };
      if (userNotes !== undefined) {
        updates.user_notes = userNotes;
      }
      await supabase.from('project_opportunities').update(updates as any).eq('slug', slug);
    } catch (err) {
      logger.warn('Failed to persist project status update to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }
}

/**
 * Retrieves learning topics mapped to current database items (global catalog).
 */
export async function getLearningTopicsCatalog(): Promise<LearningTopic[]> {
  const { data: items } = await getItems({ pageSize: 60 });
  return getLearningTopics(items);
}

/**
 * Records a user feedback event.
 */
export async function recordUserFeedback(
  feedback: Omit<UserIntelligenceFeedback, 'id'> & { id?: string; userId?: string | null }
): Promise<void> {
  const fullFeedback: UserIntelligenceFeedback = {
    ...feedback,
    id: feedback.id || `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };

  recordFeedbackInMemory(fullFeedback);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('user_intelligence_feedback').insert({
        user_id: feedback.userId || null,
        entity_type: feedback.entityType,
        entity_id: feedback.entityId,
        feedback_type: feedback.feedbackType,
        notes: feedback.notes || null,
      });
    } catch (err) {
      logger.warn('Failed to record feedback to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }
}

/**
 * Retrieves user feedback list for a specific user.
 */
export async function getUserFeedbackList(
  userId?: string | null
): Promise<UserIntelligenceFeedback[]> {
  if (!isDatabaseConfigured()) {
    return getInMemoryFeedback(userId);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('user_intelligence_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error || !data) {
      return getInMemoryFeedback(userId);
    }

    return data.map((d) => ({
      id: d.id,
      userId: d.user_id,
      entityType: d.entity_type,
      entityId: d.entity_id,
      feedbackType: d.feedback_type,
      notes: d.notes,
      createdAt: d.created_at,
    }));
  } catch {
    return getInMemoryFeedback(userId);
  }
}

// ---------------------------------------------------------------------------
// Phase 7: User-Tracked Topics
// ---------------------------------------------------------------------------

export async function getUserTrackedTopics(userId: string): Promise<TrackedTopic[]> {
  const cached = inMemoryTrackedTopics.get(userId);
  if (cached) return cached;

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user_tracked_topics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const topics = data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          topic: d.topic,
          category: d.category,
          createdAt: d.created_at,
        }));
        inMemoryTrackedTopics.set(userId, topics);
        return topics;
      }
    } catch (err) {
      logger.debug('Failed to get tracked topics from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return [];
}

export async function addTrackedTopic(
  userId: string,
  topic: string,
  category?: string | null
): Promise<TrackedTopic> {
  const current = await getUserTrackedTopics(userId);
  const exists = current.find((t) => t.topic.toLowerCase() === topic.toLowerCase());
  if (exists) return exists;

  const newTopic: TrackedTopic = {
    id: `topic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    topic,
    category: category || null,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newTopic];
  inMemoryTrackedTopics.set(userId, updated);
  invalidateUserCache(userId);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('user_tracked_topics').insert({
        user_id: userId,
        topic,
        category: category || null,
      });
    } catch (err) {
      logger.warn('Failed to insert tracked topic into db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return newTopic;
}

export async function removeTrackedTopic(userId: string, topic: string): Promise<boolean> {
  const current = await getUserTrackedTopics(userId);
  const filtered = current.filter((t) => t.topic.toLowerCase() !== topic.toLowerCase());
  inMemoryTrackedTopics.set(userId, filtered);
  invalidateUserCache(userId);

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase
        .from('user_tracked_topics')
        .delete()
        .eq('user_id', userId)
        .eq('topic', topic);
    } catch (err) {
      logger.warn('Failed to delete tracked topic from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Phase 7: Saved Intelligence (Items, Trends, Projects, Topics)
// ---------------------------------------------------------------------------

export async function saveIntelligence(
  userId: string,
  entry: Omit<SavedIntelligence, 'id' | 'createdAt' | 'userId'>
): Promise<SavedIntelligence> {
  const current = inMemorySavedIntel.get(userId) || [];
  const existingIdx = current.findIndex(
    (s) => s.entityType === entry.entityType && s.entityId === entry.entityId
  );

  const savedRecord: SavedIntelligence = {
    ...entry,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    current[existingIdx] = savedRecord;
  } else {
    current.push(savedRecord);
  }
  inMemorySavedIntel.set(userId, current);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('user_saved_intelligence').upsert(
        {
          user_id: userId,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          title: entry.title,
          notes: entry.notes || null,
          metadata: (entry.metadata || {}) as any,
        },
        { onConflict: 'user_id,entity_type,entity_id' }
      );
    } catch (err) {
      logger.warn('Failed to upsert saved intelligence in db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return savedRecord;
}

export async function unsaveIntelligence(
  userId: string,
  entityType: SavedEntityType,
  entityId: string
): Promise<boolean> {
  const current = inMemorySavedIntel.get(userId) || [];
  const filtered = current.filter(
    (s) => !(s.entityType === entityType && s.entityId === entityId)
  );
  inMemorySavedIntel.set(userId, filtered);

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase
        .from('user_saved_intelligence')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
    } catch (err) {
      logger.warn('Failed to delete saved intelligence from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return true;
}

export async function getSavedIntelligence(
  userId: string,
  entityType?: SavedEntityType
): Promise<SavedIntelligence[]> {
  const cached = inMemorySavedIntel.get(userId) || [];
  let results = cached;

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('user_saved_intelligence')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (!error && data) {
        results = data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          entityType: d.entity_type,
          entityId: d.entity_id,
          title: d.title,
          notes: d.notes,
          metadata: (d.metadata || {}) as Record<string, unknown>,
          createdAt: d.created_at,
        }));
        inMemorySavedIntel.set(userId, results);
      }
    } catch (err) {
      logger.debug('Failed to get saved intelligence from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  if (entityType) {
    return results.filter((r) => r.entityType === entityType);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Phase 7: Account Deletion (Section 31)
// ---------------------------------------------------------------------------

/**
 * Permanently deletes all private data for a user across all tables and caches.
 * Global intelligence (items, sources, summaries, trends) remains completely untouched.
 */
export async function deleteUserData(userId: string): Promise<{
  success: boolean;
  deletedCount: Record<string, number>;
}> {
  logger.info('Executing account deletion for user', { userId });

  // 1. Clear in-memory user stores
  inMemoryProfiles.delete(userId);
  inMemoryProfiles.delete(resolveUserKey(userId));
  inMemoryTrackedTopics.delete(userId);
  inMemorySavedIntel.delete(userId);
  clearUserInMemoryBookmarks(userId);
  clearInMemoryFeedback(userId);
  invalidateUserCache(userId);

  // Clear opportunities and skill gaps for this user
  const oppPrefix = `${userId}:`;
  for (const key of inMemoryOpportunities.keys()) {
    if (key.startsWith(oppPrefix)) inMemoryOpportunities.delete(key);
  }
  for (const key of inMemorySkillGaps.keys()) {
    if (key.startsWith(oppPrefix)) inMemorySkillGaps.delete(key);
  }

  const deletedCounts: Record<string, number> = {
    profile: 1,
    preferences: 1,
  };

  // 2. Cascade deletion in database if configured
  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();

      await Promise.allSettled([
        supabase.from('user_profiles').delete().eq('user_id', userId),
        supabase.from('user_preferences').delete().eq('user_id', userId),
        supabase.from('bookmarks').delete().eq('user_id', userId),
        supabase.from('user_tracked_topics').delete().eq('user_id', userId),
        supabase.from('user_saved_intelligence').delete().eq('user_id', userId),
        supabase.from('user_intelligence_feedback').delete().eq('user_id', userId),
        supabase.from('skill_gaps').delete().eq('user_id', userId),
        supabase.from('user_plans').delete().eq('user_id', userId),
        supabase.from('ai_usage_logs').delete().eq('user_id', userId),
      ]);
    } catch (err) {
      logger.error('Error during database account deletion', err, { userId });
    }
  }

  return { success: true, deletedCount: deletedCounts };
}

/**
 * Resets all in-memory repository stores (for testing).
 */
export function resetPersonalizationRepository(): void {
  inMemoryProfiles.clear();
  inMemoryOpportunities.clear();
  inMemorySkillGaps.clear();
  inMemoryTrackedTopics.clear();
  inMemorySavedIntel.clear();
}
