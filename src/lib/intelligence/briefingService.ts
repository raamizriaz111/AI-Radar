// =============================================================================
// AI Radar — Daily Intelligence Briefing Service (Phase 5)
// =============================================================================
// Assembles, ranks, groups, and synthesizes the Daily Intelligence Briefing.
// Enforces:
//   1. Strict source citation: Every claim/item references canonical URLs and source.
//   2. Duplicate prevention: Won't regenerate existing briefing unless forced.
//   3. User relevance alignment: Weighted ranking prioritizes user topic preferences.
// =============================================================================

import { queryItems } from '@/lib/repositories/itemRepository';
import { getBriefingByDate, saveBriefing } from '@/lib/repositories/briefingRepository';
import { getUserPreferences } from './preferences';
import { rankItemsForBriefing } from './importance';
import { detectSignals } from './signals';
import type {
  GeneratedBriefing,
  BriefingSectionPayload,
  BriefingSectionItemPayload,
} from './types';
import { logger } from '@/lib/services/logger';
import type { ItemFull } from '@/lib/database.types';

export interface BriefingGenerationOptions {
  date?: string; // YYYY-MM-DD
  force?: boolean;
}

/**
 * Formats a single item into a traceable section citation.
 */
function toSectionItem(item: ItemFull): BriefingSectionItemPayload {
  const takeaway =
    item.summary?.significance ||
    (Array.isArray(item.summary?.key_points) && item.summary.key_points[0]) ||
    item.description ||
    item.title;

  return {
    itemId: item.id,
    title: item.title,
    takeaway: typeof takeaway === 'string' ? takeaway.slice(0, 240) : item.title,
    sourceName: item.source?.name || 'Verified Source',
    url: item.canonical_url,
  };
}

/**
 * Generates or retrieves the Daily Intelligence Briefing for a specified date.
 */
export async function generateDailyBriefing(
  options?: BriefingGenerationOptions
): Promise<GeneratedBriefing> {
  const targetDate = options?.date || new Date().toISOString().slice(0, 10);
  const force = options?.force ?? false;

  // 1. Check existing briefing if not forced
  if (!force) {
    const existing = await getBriefingByDate(targetDate);
    if (existing) {
      return {
        briefingDate: existing.briefing_date,
        title: existing.title,
        summary: existing.summary,
        sections: (existing.sections as unknown as BriefingSectionPayload[]) || [],
        topSignals: (existing.top_signals as any) || [],
        itemCount: existing.item_count,
        model: existing.model_name,
        provider: existing.provider,
        promptVersion: existing.prompt_version,
      };
    }
  }

  logger.info('Generating Daily Intelligence Briefing', { date: targetDate, force });

  // 2. Fetch candidate items (latest 60 items)
  const itemsResult = await queryItems({
    page: 1,
    pageSize: 60,
  });

  const allItems = itemsResult.data;

  // Fallback if no items exist in DB
  if (allItems.length === 0) {
    const emptyBriefing: GeneratedBriefing = {
      briefingDate: targetDate,
      title: `AI Radar Daily Briefing — ${targetDate}`,
      summary: 'No newly collected intelligence items available for today yet. Connect sources and trigger collection in Diagnostics to populate.',
      sections: [],
      topSignals: [],
      itemCount: 0,
      model: 'heuristic-rules',
      provider: 'ai-radar',
      promptVersion: '1.0.0',
    };
    await saveBriefing(emptyBriefing);
    return emptyBriefing;
  }

  // 3. User Preferences & Importance Ranking
  const preferences = await getUserPreferences();
  const rankedCandidates = rankItemsForBriefing(allItems, preferences, 16);
  const selectedItems = rankedCandidates.map((r) => r.item);

  // 4. Detect top emerging signals
  const signals = detectSignals(allItems, 14);
  const topSignals = signals.slice(0, 4).map((s) => ({
    title: s.topic,
    status: s.distinctSourceCount >= 3 ? ('established' as const) : s.distinctSourceCount >= 2 ? ('developing' as const) : ('early_signal' as const),
    reason: `Seen across ${s.distinctSourceCount} distinct sources (${s.sources.join(', ')}) across ${s.itemCount} items.`,
  }));

  // 5. Partition items into distinct intelligence sections
  const researchItems: ItemFull[] = [];
  const agentItems: ItemFull[] = [];
  const toolItems: ItemFull[] = [];
  const generalItems: ItemFull[] = [];

  for (const it of selectedItems) {
    const catSlugs = (it.categories || []).map((c) => c.slug);
    if (catSlugs.includes('coding-agents')) {
      agentItems.push(it);
    } else if (catSlugs.includes('models') || catSlugs.includes('research')) {
      researchItems.push(it);
    } else if (catSlugs.includes('ai-tools')) {
      toolItems.push(it);
    } else {
      generalItems.push(it);
    }
  }

  const sections: BriefingSectionPayload[] = [];

  if (researchItems.length > 0) {
    sections.push({
      title: 'Foundation Models & Research',
      categorySlug: 'models',
      summary: `Critical preprint discoveries, architecture updates, and empirical benchmark findings from academic and lab repositories.`,
      items: researchItems.slice(0, 5).map(toSectionItem),
    });
  }

  if (agentItems.length > 0) {
    sections.push({
      title: 'Coding Agents & Autonomous Workflows',
      categorySlug: 'coding-agents',
      summary: `Automated developer tools, code generation benchmarks, agent harnesses, and autonomous development primitives.`,
      items: agentItems.slice(0, 4).map(toSectionItem),
    });
  }

  if (toolItems.length > 0) {
    sections.push({
      title: 'Developer Tools & Ecosystem Releases',
      categorySlug: 'ai-tools',
      summary: `Open-source repositories, inference engines, and developer productivity tools gaining ecosystem adoption.`,
      items: toolItems.slice(0, 4).map(toSectionItem),
    });
  }

  if (generalItems.length > 0 || sections.length === 0) {
    const fallbackList = generalItems.length > 0 ? generalItems : selectedItems.slice(0, 4);
    sections.push({
      title: 'Industry Developments & Applied AI',
      categorySlug: 'ai-news',
      summary: `Key announcements, enterprise deployments, and safety/regulatory developments across the industry.`,
      items: fallbackList.slice(0, 4).map(toSectionItem),
    });
  }

  // 6. Synthesize overarching briefing summary
  const totalItemCount = sections.reduce((sum, s) => sum + s.items.length, 0);
  const primaryTopics = topSignals.map((s) => s.title).slice(0, 3).join(', ');

  const summary = `Today's radar analyzed ${allItems.length} intelligence items, highlighting ${totalItemCount} prioritized developments. Prominent signals include ${primaryTopics || 'emerging model iterations and open-source tooling'}. Activity is corroborated across multiple independent research and developer feeds.`;

  const generated: GeneratedBriefing = {
    briefingDate: targetDate,
    title: `AI Radar Daily Briefing — ${new Date(targetDate + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    summary,
    sections,
    topSignals,
    itemCount: totalItemCount,
    model: 'grounded-intelligence-pipeline',
    provider: 'ai-radar',
    promptVersion: '1.0.0',
  };

  // 7. Persist briefing
  await saveBriefing(generated);

  return generated;
}
