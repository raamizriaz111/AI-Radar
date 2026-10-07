// =============================================================================
// AI Radar — Trend Repository (Phase 5)
// =============================================================================
// Data access layer for trends and evidence links.
// Resilient to missing tables (falls back to in-memory store if migration 006
// has not been executed yet in Supabase).
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type {
  TrendRow,
  TrendEvidenceRow,
  TrendStatus,
  TrendConfidence,
  ItemFull,
} from '@/lib/database.types';
import type { TrendCandidate } from '@/lib/intelligence/types';
import { logger } from '@/lib/services/logger';

export interface TrendWithEvidence extends TrendRow {
  evidenceList: Array<{
    id: string;
    relationship_type: string;
    evidence_strength: string;
    notes?: string | null;
    item: ItemFull;
  }>;
}

// In-memory cache fallback for development / offline / pre-migration mode
const inMemoryTrends = new Map<string, TrendWithEvidence>();

function getUniqueInMemoryTrends(): TrendWithEvidence[] {
  const seen = new Set<string>();
  const list: TrendWithEvidence[] = [];
  for (const t of inMemoryTrends.values()) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      list.push(t);
    }
  }
  return list;
}

function findInMemoryTrend(key: string): TrendWithEvidence | null {
  if (inMemoryTrends.has(key)) return inMemoryTrends.get(key)!;
  const stripped = key.replace(/^mem-trend-/, '');
  if (inMemoryTrends.has(stripped)) return inMemoryTrends.get(stripped)!;
  for (const t of inMemoryTrends.values()) {
    if (t.slug === key || t.id === key || t.slug === stripped || t.id === stripped) {
      return t;
    }
  }
  return null;
}

/**
 * Retrieves all stored trends, optionally filtered by status or confidence.
 */
export async function getAllTrends(options?: {
  status?: TrendStatus;
  confidence?: TrendConfidence;
  limit?: number;
}): Promise<TrendRow[]> {
  const limit = options?.limit ?? 50;

  if (!isDatabaseConfigured()) {
    let list = getUniqueInMemoryTrends();
    if (options?.status) list = list.filter((t) => t.status === options.status);
    if (options?.confidence) list = list.filter((t) => t.confidence === options.confidence);
    return list.slice(0, limit);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('trends')
      .select('*')
      .order('confidence_score', { ascending: false })
      .order('activity_change_pct', { ascending: false })
      .limit(limit);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.confidence) {
      query = query.eq('confidence', options.confidence);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message && error.message.includes('relation')) {
        logger.warn('trends table not found (run migration 006). Using memory fallback.');
        let list = getUniqueInMemoryTrends();
        if (options?.status) list = list.filter((t) => t.status === options.status);
        if (options?.confidence) list = list.filter((t) => t.confidence === options.confidence);
        return list.slice(0, limit);
      }
      logger.error('Failed to fetch trends from database', error);
      return getUniqueInMemoryTrends().slice(0, limit);
    }

    // If database returned rows, return them
    if (data && data.length > 0) {
      return data;
    }

    // Fall back to in-memory if empty
    return getUniqueInMemoryTrends().slice(0, limit);
  } catch (err) {
    logger.error('Unexpected error fetching trends', err);
    return getUniqueInMemoryTrends().slice(0, limit);
  }
}

/**
 * Retrieves a single trend by slug including its evidence links and full items.
 */
export async function getTrendBySlug(slug: string): Promise<TrendWithEvidence | null> {
  if (!slug) return null;

  // Check in-memory store first if database isn't configured
  if (!isDatabaseConfigured()) {
    return findInMemoryTrend(slug);
  }

  try {
    const supabase = await createClient();

    let { data: trend, error: trendErr } = await supabase
      .from('trends')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!trend) {
      // Check if identifier is actually an ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        const { data: trendById } = await supabase
          .from('trends')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        if (trendById) {
          trend = trendById;
        }
      }
    }

    if (trendErr || !trend) {
      return findInMemoryTrend(slug);
    }

    // Fetch associated evidence items
    const { data: evidenceRows, error: evErr } = await supabase
      .from('trend_evidence')
      .select(`
        id,
        relationship_type,
        evidence_strength,
        notes,
        item:items (
          *,
          source:sources (*),
          item_categories (
            category:categories (*)
          ),
          summaries (*)
        )
      `)
      .eq('trend_id', trend.id);

    if (evErr || !evidenceRows) {
      return {
        ...trend,
        evidenceList: [],
      };
    }

    const evidenceList = evidenceRows.map((ev: any) => {
      const it = ev.item;
      const categories = (it?.item_categories || []).map((ic: any) => ic.category).filter(Boolean);
      const summary = it?.summaries && it.summaries.length > 0 ? it.summaries[0] : null;

      const itemFull: ItemFull = {
        ...it,
        source: it?.source,
        categories,
        summary,
      };

      return {
        id: ev.id,
        relationship_type: ev.relationship_type,
        evidence_strength: ev.evidence_strength,
        notes: ev.notes,
        item: itemFull,
      };
    });

    return {
      ...trend,
      evidenceList,
    };
  } catch (err) {
    logger.error('Unexpected error in getTrendBySlug', err);
    return inMemoryTrends.get(slug) || null;
  }
}

/**
 * Persists a TrendCandidate and its evidence relationships.
 */
export async function saveTrend(candidate: TrendCandidate): Promise<TrendRow | null> {
  // Always update in-memory cache
  const inMemoryRecord: TrendWithEvidence = {
    id: `mem-trend-${candidate.slug}`,
    title: candidate.title,
    slug: candidate.slug,
    description: candidate.description,
    status: candidate.status,
    confidence: candidate.confidence,
    confidence_score: candidate.confidenceScore,
    summary: candidate.summary,
    why_it_matters: candidate.whyItMatters,
    what_to_watch: candidate.whatToWatch,
    technologies: candidate.technologies as any,
    entities: candidate.entities as any,
    topics: candidate.topics as any,
    distinct_source_count: candidate.distinctSourceCount,
    item_count: candidate.itemCount,
    activity_change_pct: candidate.activityChangePct,
    timeline: candidate.timeline as any,
    metadata: {},
    first_detected_at: candidate.timeline[0]?.date || new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    evidenceList: candidate.evidence.map((ev, i) => ({
      id: `mem-ev-${candidate.slug}-${i}`,
      relationship_type: ev.relationshipType,
      evidence_strength: ev.evidenceStrength,
      notes: ev.notes,
      item: ev.item,
    })),
  };
  inMemoryTrends.set(candidate.slug, inMemoryRecord);
  inMemoryTrends.set(inMemoryRecord.id, inMemoryRecord);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    return inMemoryRecord;
  }

  try {
    const serviceClient = createServiceClient();

    // Upsert trend by slug
    const { data: trend, error: trendErr } = await serviceClient
      .from('trends')
      .upsert(
        {
          title: candidate.title,
          slug: candidate.slug,
          description: candidate.description,
          status: candidate.status,
          confidence: candidate.confidence,
          confidence_score: candidate.confidenceScore,
          summary: candidate.summary,
          why_it_matters: candidate.whyItMatters,
          what_to_watch: candidate.whatToWatch,
          technologies: candidate.technologies as any,
          entities: candidate.entities as any,
          topics: candidate.topics as any,
          distinct_source_count: candidate.distinctSourceCount,
          item_count: candidate.itemCount,
          activity_change_pct: candidate.activityChangePct,
          timeline: candidate.timeline as any,
          first_detected_at: candidate.timeline[0]?.date || new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select('*')
      .single();

    if (trendErr || !trend) {
      if (trendErr?.message && trendErr.message.includes('relation')) {
        logger.warn('trends table not yet created (run migration 006). Stored in memory.');
      } else {
        logger.error('Failed to upsert trend to database', trendErr);
      }
      return inMemoryRecord;
    }

    // Upsert evidence items
    for (const ev of candidate.evidence) {
      if (!ev.item?.id) continue;
      await serviceClient
        .from('trend_evidence')
        .upsert(
          {
            trend_id: trend.id,
            item_id: ev.item.id,
            relationship_type: ev.relationshipType,
            evidence_strength: ev.evidenceStrength,
            notes: ev.notes || null,
          },
          { onConflict: 'trend_id,item_id' }
        );
    }

    return trend;
  } catch (err) {
    logger.error('Unexpected error in saveTrend', err);
    return inMemoryRecord;
  }
}

/**
 * Saves a batch of trend candidates.
 */
export async function saveTrendsBatch(candidates: TrendCandidate[]): Promise<number> {
  let savedCount = 0;
  for (const candidate of candidates) {
    const saved = await saveTrend(candidate);
    if (saved) savedCount++;
  }
  return savedCount;
}
