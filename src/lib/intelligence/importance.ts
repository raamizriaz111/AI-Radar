// =============================================================================
// AI Radar — Transparent Importance & Ranking Engine (Phase 5)
// =============================================================================
// Evaluates item importance using an open, explainable weighted score:
//   Recency (35%) + Source Trust (20%) + Evidence Breadth (20%) + User Relevance (25%)
// Deduplicates near-identical records to emphasize novelty.
// =============================================================================

import type { ItemFull } from '@/lib/database.types';
import type { UserPreferences } from '@/lib/types';
import { computeUserRelevance } from './preferences';
import type { ImportanceScores, RankedItem } from './types';

/**
 * Computes transparent importance breakdown for an individual item.
 */
export function calculateItemImportance(
  item: ItemFull,
  preferences?: UserPreferences
): { scores: ImportanceScores; matchedTopics: string[]; relevanceReason?: string } {
  const now = Date.now();
  const publishedDate = new Date(item.published_at || item.discovered_at).getTime();
  const ageDays = Math.max(0, (now - publishedDate) / (1000 * 60 * 60 * 24));

  // 1. Recency Score (Exponential decay: 1.0 today, ~0.63 at 3d, ~0.35 at 7d)
  const recencyScore = Math.max(0.05, Math.min(1.0, Math.exp(-0.15 * ageDays)));

  // 2. Source Trust Score (Trust level 1-3 mapped to 0.6 - 1.0)
  let sourceTrustScore = 0.75;
  if (item.source) {
    if (item.source.trust_level === 3) sourceTrustScore = 1.0;
    else if (item.source.trust_level === 2) sourceTrustScore = 0.85;
    else sourceTrustScore = 0.65;
  }

  // 3. Evidence Breadth Score (Depth of extracted facts & claims)
  let evidenceBreadthScore = 0.40; // baseline for un-enriched item
  if (item.summary) {
    evidenceBreadthScore = 0.70;
    const keyPoints = Array.isArray(item.summary.key_points) ? item.summary.key_points : [];
    const claims = Array.isArray(item.summary.claims) ? item.summary.claims : [];
    const technologies = Array.isArray(item.summary.technologies) ? item.summary.technologies : [];

    if (keyPoints.length >= 3) evidenceBreadthScore += 0.10;
    if (claims.length >= 2) evidenceBreadthScore += 0.10;
    if (technologies.length >= 2) evidenceBreadthScore += 0.10;
  }
  evidenceBreadthScore = Math.min(1.0, evidenceBreadthScore);

  // 4. User Relevance Score
  let userRelevanceScore = 0.50; // neutral default
  let matchedTopics: string[] = [];
  let relevanceReason: string | undefined;

  if (preferences) {
    const rel = computeUserRelevance(item, preferences);
    userRelevanceScore = rel.score;
    matchedTopics = rel.matchedTopics;
    relevanceReason = rel.reason;
  }

  // 5. Total Weighted Score
  // Weights: Recency 35%, Source Trust 20%, Evidence Breadth 20%, User Relevance 25%
  const totalScore = Number(
    (
      0.35 * recencyScore +
      0.20 * sourceTrustScore +
      0.20 * evidenceBreadthScore +
      0.25 * userRelevanceScore
    ).toFixed(3)
  );

  return {
    scores: {
      recencyScore: Number(recencyScore.toFixed(3)),
      sourceTrustScore: Number(sourceTrustScore.toFixed(3)),
      evidenceBreadthScore: Number(evidenceBreadthScore.toFixed(3)),
      userRelevanceScore: Number(userRelevanceScore.toFixed(3)),
      totalScore,
    },
    matchedTopics,
    relevanceReason,
  };
}

/**
 * Normalizes title for novelty deduplication check.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks similarity between two titles (Jaccard word overlap).
 */
function titleSimilarity(t1: string, t2: string): number {
  const words1 = new Set(normalizeTitle(t1).split(' ').filter((w) => w.length > 3));
  const words2 = new Set(normalizeTitle(t2).split(' ').filter((w) => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Ranks items for daily briefing with novelty deduplication.
 * Eliminates duplicate coverage of the same research paper or repository.
 */
export function rankItemsForBriefing(
  items: ItemFull[],
  preferences?: UserPreferences,
  limit = 20
): RankedItem[] {
  if (!items || items.length === 0) return [];

  // Calculate scores for all items
  const scoredItems: RankedItem[] = items.map((item) => {
    const { scores, matchedTopics } = calculateItemImportance(item, preferences);
    return {
      item,
      importance: scores,
      matchedTopics,
    };
  });

  // Sort descending by total score
  scoredItems.sort((a, b) => b.importance.totalScore - a.importance.totalScore);

  // Novelty filter: reject items with > 0.65 title word overlap with an already selected higher-scoring item
  const selected: RankedItem[] = [];

  for (const candidate of scoredItems) {
    const isDuplicate = selected.some(
      (existing) => titleSimilarity(existing.item.title, candidate.item.title) > 0.65
    );

    if (!isDuplicate) {
      selected.push(candidate);
    }

    if (selected.length >= limit) break;
  }

  return selected;
}
