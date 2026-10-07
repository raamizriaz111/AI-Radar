// =============================================================================
// AI Radar — Emerging Signal Detection (Phase 5)
// =============================================================================
// Deterministic detection of recurring signals across items and sources.
// Enforces source independence: multiple items from the same source count as
// 1 source.
// =============================================================================

import type { ItemFull } from '@/lib/database.types';
import type { DetectedSignal } from './types';

const CONTRADICTION_KEYWORDS = [
  'limitation',
  'regression',
  'flaw',
  'vulnerability',
  'hallucination',
  'failure',
  'dispute',
  'disputed',
  'contradict',
  'contradicts',
  'weakness',
  'overhyped',
  'jailbreak',
  'security risk',
  'benchmark leak',
];

/**
 * Normalizes keyword/entity names to aggregate synonyms (e.g. "deepseek-r1" and "deepseek r1").
 */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Checks if an item contains contradiction signals.
 */
function detectItemContradictions(item: ItemFull): { hasContradiction: boolean; reason?: string } {
  const textToCheck = [
    item.title,
    item.description || '',
    item.summary?.summary || '',
    ...(Array.isArray(item.summary?.key_points) ? (item.summary.key_points as string[]) : []),
    ...(Array.isArray(item.summary?.warning_flags) ? (item.summary.warning_flags as string[]) : []),
  ].join(' ').toLowerCase();

  for (const kw of CONTRADICTION_KEYWORDS) {
    if (textToCheck.includes(kw)) {
      return {
        hasContradiction: true,
        reason: `Item mentions "${kw}": "${item.title}"`,
      };
    }
  }

  return { hasContradiction: false };
}

/**
 * Extracts candidate signal anchors (technologies, entities, core topics) from an item.
 */
function extractAnchors(item: ItemFull): Array<{ name: string; kind: DetectedSignal['kind'] }> {
  const anchors: Array<{ name: string; kind: DetectedSignal['kind'] }> = [];
  const seen = new Set<string>();

  const addAnchor = (name: string, kind: DetectedSignal['kind']) => {
    const clean = name.trim();
    if (clean.length < 3 || clean.length > 50) return;
    const lower = clean.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    anchors.push({ name: clean, kind });
  };

  // 1. From AI summary technologies
  if (Array.isArray(item.summary?.technologies)) {
    for (const tech of item.summary.technologies as string[]) {
      addAnchor(tech, 'technology');
    }
  }

  // 2. From AI summary entities
  if (Array.isArray(item.summary?.entities)) {
    for (const ent of item.summary.entities as Array<{ name?: string; type?: string }>) {
      if (ent?.name) {
        addAnchor(ent.name, 'entity');
      }
    }
  }

  // 3. From AI summary topics
  if (Array.isArray(item.summary?.topics)) {
    for (const topic of item.summary.topics as string[]) {
      addAnchor(topic, 'topic');
    }
  }

  // 4. From Title heuristic tags if no summary
  if (anchors.length === 0) {
    const titleWords = item.title.split(/[\s:,-]+/);
    for (const word of titleWords) {
      if (word.length >= 4 && /^[A-Z]/.test(word)) {
        addAnchor(word, 'topic');
      }
    }
  }

  return anchors;
}

/**
 * Detects emerging signals from a collection of items.
 *
 * Groups items by technology, entity, or topic, evaluates distinct sources,
 * and calculates temporal velocity.
 */
export function detectSignals(items: ItemFull[], windowDays = 14): DetectedSignal[] {
  if (!items || items.length === 0) return [];

  const now = new Date().getTime();
  const halfWindowMs = (windowDays / 2) * 24 * 60 * 60 * 1000;
  const fullWindowMs = windowDays * 24 * 60 * 60 * 1000;

  // Group items by normalized anchor key
  const groups = new Map<
    string,
    {
      displayKey: string;
      kind: DetectedSignal['kind'];
      items: ItemFull[];
      sources: Set<string>;
      categories: Set<string>;
      contradictionNotes: string[];
    }
  >();

  for (const item of items) {
    const itemDate = new Date(item.published_at || item.discovered_at).getTime();
    // Skip items older than the analysis window
    if (now - itemDate > fullWindowMs) continue;

    const sourceName = item.source?.name || 'Unknown Source';
    const contradiction = detectItemContradictions(item);
    const anchors = extractAnchors(item);

    for (const anchor of anchors) {
      const normKey = normalizeKey(anchor.name);
      if (!groups.has(normKey)) {
        groups.set(normKey, {
          displayKey: anchor.name,
          kind: anchor.kind,
          items: [],
          sources: new Set<string>(),
          categories: new Set<string>(),
          contradictionNotes: [],
        });
      }

      const grp = groups.get(normKey)!;
      grp.items.push(item);
      grp.sources.add(sourceName);
      if (item.categories) {
        for (const cat of item.categories) {
          grp.categories.add(cat.slug);
        }
      }
      if (contradiction.hasContradiction && contradiction.reason) {
        grp.contradictionNotes.push(contradiction.reason);
      }
    }
  }

  const signals: DetectedSignal[] = [];

  for (const [normKey, grp] of groups.entries()) {
    // A signal requires at least 2 mentions OR 1 multi-category item
    if (grp.items.length < 2 && grp.sources.size < 2) continue;

    // Deduplicate items in the group by id
    const uniqueItemsMap = new Map<string, ItemFull>();
    for (const it of grp.items) {
      uniqueItemsMap.set(it.id, it);
    }
    const uniqueItems = Array.from(uniqueItemsMap.values());

    // Sort items chronologically
    uniqueItems.sort((a, b) => {
      const da = new Date(a.published_at || a.discovered_at).getTime();
      const db = new Date(b.published_at || b.discovered_at).getTime();
      return da - db;
    });

    const firstSeenAt = uniqueItems[0].published_at || uniqueItems[0].discovered_at;
    const lastSeenAt = uniqueItems[uniqueItems.length - 1].published_at || uniqueItems[uniqueItems.length - 1].discovered_at;

    // Activity change velocity: items in recent half-window vs previous half-window
    let recentCount = 0;
    let previousCount = 0;

    for (const it of uniqueItems) {
      const d = new Date(it.published_at || it.discovered_at).getTime();
      if (now - d <= halfWindowMs) {
        recentCount++;
      } else {
        previousCount++;
      }
    }

    let activityChangePct = 0;
    if (previousCount === 0) {
      activityChangePct = recentCount > 0 ? 100 : 0;
    } else {
      activityChangePct = Math.round(((recentCount - previousCount) / previousCount) * 100);
    }

    const hasContradictions = grp.contradictionNotes.length > 0;

    signals.push({
      id: `signal-${normKey.replace(/[^a-z0-9]/g, '-')}`,
      topic: grp.displayKey,
      technologyOrEntity: grp.displayKey,
      kind: grp.kind,
      itemCount: uniqueItems.length,
      distinctSourceCount: grp.sources.size,
      sources: Array.from(grp.sources),
      categories: Array.from(grp.categories),
      firstSeenAt,
      lastSeenAt,
      activityChangePct,
      recentItems: uniqueItems.slice(-5), // top 5 most recent
      hasContradictions,
      contradictionNotes: hasContradictions ? grp.contradictionNotes.slice(0, 3).join('; ') : undefined,
    });
  }

  // Sort signals by distinct sources (desc), then item count (desc), then activity change (desc)
  signals.sort((a, b) => {
    if (b.distinctSourceCount !== a.distinctSourceCount) {
      return b.distinctSourceCount - a.distinctSourceCount;
    }
    if (b.itemCount !== a.itemCount) {
      return b.itemCount - a.itemCount;
    }
    return b.activityChangePct - a.activityChangePct;
  });

  return signals;
}
