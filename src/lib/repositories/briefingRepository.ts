// =============================================================================
// AI Radar — Daily Briefing Repository (Phase 5)
// =============================================================================
// Data access layer for Daily Intelligence Briefings.
// Resilient to missing tables (in-memory store fallback if migration 006
// has not been executed yet).
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { DailyBriefingRow, Json } from '@/lib/database.types';
import type { GeneratedBriefing } from '@/lib/intelligence/types';
import { logger } from '@/lib/services/logger';

// In-memory cache fallback for development / offline / pre-migration mode
const inMemoryBriefings = new Map<string, DailyBriefingRow>();

/**
 * Retrieves the most recent Daily Intelligence Briefing.
 */
export async function getLatestBriefing(): Promise<DailyBriefingRow | null> {
  if (!isDatabaseConfigured()) {
    const list = Array.from(inMemoryBriefings.values()).sort(
      (a, b) => new Date(b.briefing_date).getTime() - new Date(a.briefing_date).getTime()
    );
    return list[0] || null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('daily_briefings')
      .select('*')
      .order('briefing_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.message && error.message.includes('relation')) {
        logger.warn('daily_briefings table not found (run migration 006). Using memory fallback.');
      } else {
        logger.error('Failed to fetch latest briefing', error);
      }
      const list = Array.from(inMemoryBriefings.values()).sort(
        (a, b) => new Date(b.briefing_date).getTime() - new Date(a.briefing_date).getTime()
      );
      return list[0] || null;
    }

    if (data) return data;

    const list = Array.from(inMemoryBriefings.values()).sort(
      (a, b) => new Date(b.briefing_date).getTime() - new Date(a.briefing_date).getTime()
    );
    return list[0] || null;
  } catch (err) {
    logger.error('Unexpected error in getLatestBriefing', err);
    return null;
  }
}

/**
 * Retrieves a Daily Intelligence Briefing by specific date (YYYY-MM-DD).
 */
export async function getBriefingByDate(dateStr: string): Promise<DailyBriefingRow | null> {
  if (!dateStr) return null;

  if (!isDatabaseConfigured()) {
    return inMemoryBriefings.get(dateStr) || null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('daily_briefings')
      .select('*')
      .eq('briefing_date', dateStr)
      .maybeSingle();

    if (error || !data) {
      return inMemoryBriefings.get(dateStr) || null;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error in getBriefingByDate', err);
    return inMemoryBriefings.get(dateStr) || null;
  }
}

/**
 * Retrieves the history of generated briefings.
 */
export async function getBriefingHistory(limit = 14): Promise<Array<{
  id: string;
  briefing_date: string;
  title: string;
  item_count: number;
  created_at: string;
}>> {
  if (!isDatabaseConfigured()) {
    return Array.from(inMemoryBriefings.values())
      .sort((a, b) => new Date(b.briefing_date).getTime() - new Date(a.briefing_date).getTime())
      .slice(0, limit)
      .map((b) => ({
        id: b.id,
        briefing_date: b.briefing_date,
        title: b.title,
        item_count: b.item_count,
        created_at: b.created_at,
      }));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('daily_briefings')
      .select('id, briefing_date, title, item_count, created_at')
      .order('briefing_date', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return Array.from(inMemoryBriefings.values())
        .sort((a, b) => new Date(b.briefing_date).getTime() - new Date(a.briefing_date).getTime())
        .slice(0, limit)
        .map((b) => ({
          id: b.id,
          briefing_date: b.briefing_date,
          title: b.title,
          item_count: b.item_count,
          created_at: b.created_at,
        }));
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error fetching briefing history', err);
    return [];
  }
}

/**
 * Saves or updates a Daily Intelligence Briefing.
 */
export async function saveBriefing(briefing: GeneratedBriefing): Promise<DailyBriefingRow | null> {
  const inMemoryRecord: DailyBriefingRow = {
    id: `mem-briefing-${briefing.briefingDate}`,
    briefing_date: briefing.briefingDate,
    title: briefing.title,
    summary: briefing.summary,
    sections: briefing.sections as unknown as Json,
    top_signals: briefing.topSignals as unknown as Json,
    item_count: briefing.itemCount,
    model_name: briefing.model,
    provider: briefing.provider,
    prompt_version: briefing.promptVersion,
    metadata: {},
    generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryBriefings.set(briefing.briefingDate, inMemoryRecord);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    return inMemoryRecord;
  }

  try {
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from('daily_briefings')
      .upsert(
        {
          briefing_date: briefing.briefingDate,
          title: briefing.title,
          summary: briefing.summary,
          sections: briefing.sections as unknown as Json,
          top_signals: briefing.topSignals as unknown as Json,
          item_count: briefing.itemCount,
          model_name: briefing.model,
          provider: briefing.provider,
          prompt_version: briefing.promptVersion,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'briefing_date' }
      )
      .select('*')
      .single();

    if (error) {
      if (error.message && error.message.includes('relation')) {
        logger.warn('daily_briefings table missing (run migration 006). Stored in memory.');
      } else {
        logger.error('Failed to save daily briefing to database', error);
      }
      return inMemoryRecord;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error saving daily briefing', err);
    return inMemoryRecord;
  }
}
