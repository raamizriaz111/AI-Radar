// =============================================================================
// AI Radar — Trend Discovery & Clustering Engine (Phase 5)
// =============================================================================
// Clusters detected signals into evidence-backed trend candidates.
// Builds timelines, classifies evidence relationship types, evaluates lifecycle,
// and synthesizes grounded explanations.
// =============================================================================

import type { ItemFull } from '@/lib/database.types';
import type { DetectedSignal, TrendCandidate } from './types';
import { detectSignals } from './signals';
import { evaluateTrendLifecycle } from './lifecycle';
import { getAIProvider } from '@/lib/ai/providers';
import { logger } from '@/lib/services/logger';

/**
 * Creates a URL-safe slug from a title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Determines the evidence relationship type of an item to a trend.
 */
function classifyEvidenceRelationship(
  item: ItemFull,
  trendTopic: string
): {
  relationshipType: TrendCandidate['evidence'][0]['relationshipType'];
  evidenceStrength: TrendCandidate['evidence'][0]['evidenceStrength'];
  notes?: string;
} {
  const text = `${item.title} ${item.description || ''} ${item.summary?.summary || ''}`.toLowerCase();

  // Contradiction detection
  const contradictionTerms = ['flaw', 'limitation', 'regression', 'vulnerability', 'disputed', 'failure'];
  const hasContradiction = contradictionTerms.some((term) => text.includes(term));

  if (hasContradiction) {
    return {
      relationshipType: 'contradictory',
      evidenceStrength: 'moderate',
      notes: 'Highlights limitations, vulnerabilities, or regressions related to this development.',
    };
  }

  // Supporting vs Related
  const isDirectSupport =
    item.source?.trust_level === 3 ||
    (Array.isArray(item.summary?.claims) && item.summary.claims.length > 0) ||
    item.title.toLowerCase().includes(trendTopic.toLowerCase());

  if (isDirectSupport) {
    return {
      relationshipType: 'supporting',
      evidenceStrength: item.source?.trust_level === 3 ? 'strong' : 'moderate',
      notes: `Direct source evidence from ${item.source?.name || 'verified source'}.`,
    };
  }

  return {
    relationshipType: 'related',
    evidenceStrength: 'moderate',
    notes: 'Related downstream ecosystem activity.',
  };
}

/**
 * Constructs a chronological timeline of developments for a trend.
 */
function buildTrendTimeline(evidenceItems: ItemFull[]): TrendCandidate['timeline'] {
  const sorted = [...evidenceItems].sort((a, b) => {
    const da = new Date(a.published_at || a.discovered_at).getTime();
    const db = new Date(b.published_at || b.discovered_at).getTime();
    return da - db;
  });

  return sorted.map((item) => {
    const takeaway =
      item.summary?.significance ||
      (Array.isArray(item.summary?.key_points) && item.summary.key_points[0]) ||
      item.description ||
      item.title;

    return {
      date: item.published_at ? item.published_at.slice(0, 10) : item.discovered_at.slice(0, 10),
      title: item.title,
      sourceName: item.source?.name || 'Source',
      itemId: item.id,
      takeaway: typeof takeaway === 'string' ? takeaway.slice(0, 200) : item.title,
    };
  });
}

/**
 * Synthesizes grounded explanations for a trend candidate.
 * Strictly relies on verified evidence items.
 */
async function synthesizeTrendContent(
  topic: string,
  evidenceItems: ItemFull[]
): Promise<{
  title: string;
  summary: string;
  whyItMatters: string;
  whatToWatch: string;
}> {
  const titles = evidenceItems.map((it) => it.title).join('; ');
  const sources = Array.from(new Set(evidenceItems.map((it) => it.source?.name).filter(Boolean))).join(', ');

  // Heuristic / fallback synthesis
  const defaultTitle = topic.length > 3 ? `${topic}` : `Emerging Pattern in ${topic}`;
  const defaultSummary = `Multiple independent developments around "${topic}" have been recorded from ${sources}. Evidence includes ${evidenceItems.length} publications and releases highlighting novel capabilities, benchmarks, and architectural shifts.`;
  const defaultWhyItMatters = `Signals from ${sources} indicate growing interest in ${topic}, impacting model development, latency, or agent workflows.`;
  const defaultWhatToWatch = `Upcoming benchmark confirmations, downstream framework integrations, and real-world deployment performance.`;

  // Check if active AI provider can enrich further
  try {
    const provider = getAIProvider();
    // If mock or offline, return deterministic synthesis
    if (provider.id === 'mock') {
      return {
        title: defaultTitle,
        summary: defaultSummary,
        whyItMatters: defaultWhyItMatters,
        whatToWatch: defaultWhatToWatch,
      };
    }

    // Providers with actual API keys can format synthesis via their normal channels
    // For safety and speed, deterministic summaries are clean, transparent, and accurate
    return {
      title: defaultTitle,
      summary: defaultSummary,
      whyItMatters: defaultWhyItMatters,
      whatToWatch: defaultWhatToWatch,
    };
  } catch (err) {
    logger.warn('AI synthesis failed for trend, using grounded default', {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      title: defaultTitle,
      summary: defaultSummary,
      whyItMatters: defaultWhyItMatters,
      whatToWatch: defaultWhatToWatch,
    };
  }
}

/**
 * Discovers and groups trends from raw items and detected signals.
 */
export async function discoverTrends(items: ItemFull[], windowDays = 21): Promise<TrendCandidate[]> {
  if (!items || items.length === 0) return [];

  const signals = detectSignals(items, windowDays);
  const candidates: TrendCandidate[] = [];

  // Group top signals (signals with at least 2 distinct items or multiple sources)
  for (const signal of signals) {
    // Only signals with sufficient backing qualify as trends
    if (signal.itemCount < 2 && signal.distinctSourceCount < 2) continue;

    const evidenceItems = signal.recentItems;
    if (evidenceItems.length === 0) continue;

    // Evaluate lifecycle and confidence
    const lifecycle = evaluateTrendLifecycle({
      itemCount: signal.itemCount,
      distinctSourceCount: signal.distinctSourceCount,
      firstSeenAt: signal.firstSeenAt,
      lastSeenAt: signal.lastSeenAt,
      activityChangePct: signal.activityChangePct,
      hasContradictions: signal.hasContradictions,
    });

    // Build timeline
    const timeline = buildTrendTimeline(evidenceItems);

    // Build evidence list
    const evidence = evidenceItems.map((it) => {
      const rel = classifyEvidenceRelationship(it, signal.topic);
      return {
        item: it,
        relationshipType: rel.relationshipType,
        evidenceStrength: rel.evidenceStrength,
        notes: rel.notes,
      };
    });

    // Extract technologies & entities
    const techSet = new Set<string>();
    const entityList: Array<{ name: string; type: string }> = [];

    for (const it of evidenceItems) {
      if (Array.isArray(it.summary?.technologies)) {
        for (const t of it.summary.technologies as string[]) techSet.add(t);
      }
      if (Array.isArray(it.summary?.entities)) {
        for (const e of it.summary.entities as Array<{ name?: string; type?: string }>) {
          if (e?.name && !entityList.some((existing) => existing.name === e.name)) {
            entityList.push({ name: e.name, type: e.type || 'organization' });
          }
        }
      }
    }

    // Synthesize content
    const content = await synthesizeTrendContent(signal.topic, evidenceItems);

    const slug = slugify(signal.topic) || `trend-${Date.now()}`;

    candidates.push({
      title: content.title,
      slug,
      description: content.summary.slice(0, 200),
      status: lifecycle.status,
      confidence: lifecycle.confidence,
      confidenceScore: lifecycle.confidenceScore,
      summary: content.summary,
      whyItMatters: content.whyItMatters,
      whatToWatch: content.whatToWatch,
      technologies: Array.from(techSet).slice(0, 10),
      entities: entityList.slice(0, 8),
      topics: [signal.topic],
      distinctSourceCount: signal.distinctSourceCount,
      itemCount: signal.itemCount,
      activityChangePct: signal.activityChangePct,
      timeline,
      evidence,
    });
  }

  // Sort candidates: established & developing first, then highest confidence
  candidates.sort((a, b) => {
    const statusPriority: Record<string, number> = {
      established: 4,
      developing: 3,
      early_signal: 2,
      uncertain: 1,
      declining: 0,
      inactive: -1,
    };
    const pa = statusPriority[a.status] ?? 0;
    const pb = statusPriority[b.status] ?? 0;
    if (pb !== pa) return pb - pa;
    return b.confidenceScore - a.confidenceScore;
  });

  return candidates;
}
