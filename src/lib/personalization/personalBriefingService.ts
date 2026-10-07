// =============================================================================
// AI Radar — Personalized Briefing Extension Service (Phase 7 Multi-User)
// =============================================================================
// Augments the daily intelligence briefing with a personalized
// "What Matters To You" section grounded in each user's explicit profile.
// Filters out items explicitly dismissed by the user.
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { UserProfile, PersonalRelevanceMatch } from './types';
import { computePersonalRelevance } from './personalRelevance';
import { isEntityDismissed } from './feedbackService';

export interface PersonalizedBriefingItem {
  itemId: string;
  title: string;
  takeaway: string;
  sourceName: string;
  url: string;
  relevanceScore: number;
  relevanceReasons: string[];
  matchedSkills: string[];
}

export interface PersonalizedBriefingSection {
  title: string;
  summary: string;
  items: PersonalizedBriefingItem[];
  highRelevanceCount: number;
}

/**
 * Builds the personalized section for the daily briefing
 */
export function buildPersonalizedBriefingSection(
  items: ItemFull[],
  profile: UserProfile,
  userId?: string | null
): PersonalizedBriefingSection {
  const scoredItems: Array<{
    item: ItemFull;
    match: PersonalRelevanceMatch;
  }> = [];

  const effectiveUserId = userId || profile.userId;

  for (const item of items) {
    // Respect user dismissals
    if (isEntityDismissed('item', item.id, undefined, effectiveUserId)) {
      continue;
    }

    const match = computePersonalRelevance(item, profile);
    if (!match.isExcluded && match.score > 25) {
      scoredItems.push({ item, match });
    }
  }

  // Sort by score descending
  scoredItems.sort((a, b) => b.match.score - a.match.score);

  const topMatches = scoredItems.slice(0, 5);
  const highRelevanceMatches = scoredItems.filter((s) => s.match.score >= 50);

  const itemsList: PersonalizedBriefingItem[] = topMatches.map(({ item, match }) => {
    const takeaway =
      item.summary?.summary?.slice(0, 150) ||
      item.description?.slice(0, 150) ||
      'Important development relevant to your selected focus areas.';

    return {
      itemId: item.id,
      title: item.title,
      takeaway: takeaway.endsWith('.') ? takeaway : `${takeaway}...`,
      sourceName: item.source?.name || 'Primary Source',
      url: item.canonical_url,
      relevanceScore: match.score,
      relevanceReasons: match.reasons.slice(0, 2),
      matchedSkills: match.matchedSkills,
    };
  });

  const summary =
    itemsList.length > 0
      ? `We identified ${highRelevanceMatches.length} high-relevance update${
          highRelevanceMatches.length === 1 ? '' : 's'
        } specifically aligned with your role (${profile.primaryRoleInterest}) and active learning goals.`
      : `No items today directly matched your specific profile filters. Browse general sections below for broader developments.`;

  return {
    title: 'What Matters To You Today',
    summary,
    items: itemsList,
    highRelevanceCount: highRelevanceMatches.length,
  };
}
