// =============================================================================
// AI Radar — Deterministic Classifier (Phase 3)
// =============================================================================
// Maps raw items to ItemTypes and category slugs using deterministic rules.
// NO AI or LLM is used here — classification is purely rule-based.
//
// Rules are applied in priority order. First matching rule wins.
// Categories mirror the slugs seeded in migration 001_core_schema.sql:
//   ai-news, ai-tools, models, coding-agents, emerging-trends,
//   career, business, safety-regulation
// =============================================================================

import type { CreateItemInput } from '@/lib/validation/schemas';

export type ItemType = CreateItemInput['item_type'];

interface ClassificationResult {
  itemType: ItemType;
  categorySlugs: string[];
}

// ---------------------------------------------------------------------------
// Category slug constants (must match DB seeds in 001_core_schema.sql)
// ---------------------------------------------------------------------------

const CAT = {
  NEWS: 'ai-news',
  TOOLS: 'ai-tools',
  MODELS: 'models',
  CODING: 'coding-agents',
  TRENDS: 'emerging-trends',
  CAREER: 'career',
  BUSINESS: 'business',
  SAFETY: 'safety-regulation',
} as const;

// ---------------------------------------------------------------------------
// Source-type based defaults
// ---------------------------------------------------------------------------

type SourceType =
  | 'arxiv'
  | 'huggingface'
  | 'github'
  | 'openai_blog'
  | 'anthropic_blog'
  | 'deepmind_blog'
  | 'other';

const SOURCE_DEFAULTS: Record<SourceType, ClassificationResult> = {
  arxiv: { itemType: 'research_paper', categorySlugs: [CAT.MODELS] },
  huggingface: { itemType: 'model_release', categorySlugs: [CAT.MODELS] },
  github: { itemType: 'repository', categorySlugs: [CAT.TOOLS] },
  openai_blog: { itemType: 'announcement', categorySlugs: [CAT.NEWS] },
  anthropic_blog: { itemType: 'announcement', categorySlugs: [CAT.NEWS] },
  deepmind_blog: { itemType: 'announcement', categorySlugs: [CAT.NEWS] },
  other: { itemType: 'other', categorySlugs: [CAT.NEWS] },
};

// ---------------------------------------------------------------------------
// Keyword rules — applied to normalised title + description text
// Each rule can override itemType and/or add additional category slugs.
// Rules are checked in order; multiple can match.
// ---------------------------------------------------------------------------

interface KeywordRule {
  patterns: RegExp[];
  addCategories?: string[];
  setItemType?: ItemType;
}

const KEYWORD_RULES: KeywordRule[] = [
  // Safety & regulation signals
  {
    patterns: [/safety/i, /alignment/i, /regulation/i, /policy/i, /governance/i, /responsible ai/i, /\bact\b.*ai\b/i, /ai act/i, /\brisk\b/i, /\bbias\b/i, /\bfairness\b/i, /\bprivacy\b/i],
    addCategories: [CAT.SAFETY],
    setItemType: 'policy_update',
  },
  // Coding agent / developer tools signals
  {
    patterns: [/\bcopilot\b/i, /coding agent/i, /code assistant/i, /\bdevin\b/i, /\bcursor\b/i, /\btabby\b/i, /\bcody\b/i, /agentic coding/i, /autonomous coding/i, /\bswe-bench\b/i, /developer agent/i],
    addCategories: [CAT.CODING],
    setItemType: 'tool_release',
  },
  // Model release signals
  {
    patterns: [/\bgpt-\d/i, /\bclaude\b/i, /\bgemini\b/i, /\bllama\b/i, /\bmistral\b/i, /\bqwen\b/i, /\bpalm\b/i, /\bmodel release/i, /new model/i, /open.?source.*model/i, /foundation model/i, /language model/i, /multimodal/i],
    addCategories: [CAT.MODELS],
    setItemType: 'model_release',
  },
  // Research paper signals
  {
    patterns: [/arxiv/i, /\bpaper\b/i, /benchmark/i, /\bevals?\b/i, /dataset/i, /preprint/i, /\bablation\b/i, /\bfine.?tun/i, /\brlhf\b/i, /\bdpo\b/i, /reinforcement learning/i],
    addCategories: [CAT.MODELS],
    setItemType: 'research_paper',
  },
  // Business / funding signals
  {
    patterns: [/funding/i, /\braises?\b/i, /\binvest/i, /\bstartup\b/i, /\bseries [a-e]\b/i, /\bvaluation\b/i, /\bipo\b/i, /\bacquisition\b/i, /\bpartnership\b/i, /\brevenue\b/i],
    addCategories: [CAT.BUSINESS],
    setItemType: 'funding',
  },
  // Career / learning signals
  {
    patterns: [/\bcourse\b/i, /\btutorial\b/i, /\blearn\b/i, /\bcertif/i, /\bjob\b/i, /\bhiring\b/i, /\bskills?\b/i, /\bcareer\b/i, /\bbootcamp\b/i],
    addCategories: [CAT.CAREER],
    setItemType: 'career_signal',
  },
  // Agentic / autonomous agent signals (emerging trend)
  {
    patterns: [/\bagent\b/i, /agentic/i, /multi.?agent/i, /autonomous.*ai/i, /ai.*autonomous/i, /\borchestrat/i, /tool.?use/i, /function.?call/i],
    addCategories: [CAT.TRENDS, CAT.TOOLS],
  },
];

// ---------------------------------------------------------------------------
// Public classifier function
// ---------------------------------------------------------------------------

/**
 * Classify an item deterministically based on source type and content signals.
 *
 * @param sourceType - The type slug of the source this item came from.
 * @param title - Normalised item title.
 * @param description - Optional normalised item description.
 * @param rawCategories - Optional category strings from the source itself (e.g. arXiv subject).
 */
export function classifyItem(
  sourceType: SourceType,
  title: string,
  description?: string | null,
  rawCategories?: string[]
): ClassificationResult {
  // Start with source-type defaults
  const defaults = SOURCE_DEFAULTS[sourceType] ?? SOURCE_DEFAULTS.other;
  let itemType: ItemType = defaults.itemType;
  const categorySet = new Set(defaults.categorySlugs);

  // Apply keyword rules to combined text
  const haystack = `${title} ${description ?? ''}`.toLowerCase();

  for (const rule of KEYWORD_RULES) {
    const matched = rule.patterns.some((p) => p.test(haystack));
    if (matched) {
      if (rule.setItemType) {
        itemType = rule.setItemType;
      }
      if (rule.addCategories) {
        rule.addCategories.forEach((c) => categorySet.add(c));
      }
    }
  }

  // Map arXiv subject codes to additional categories
  if (rawCategories) {
    for (const cat of rawCategories) {
      const slug = cat.toLowerCase();
      if (slug.startsWith('cs.')) categorySet.add(CAT.MODELS);
      if (slug === 'cs.ai' || slug === 'cs.lg' || slug === 'stat.ml') categorySet.add(CAT.MODELS);
      if (slug === 'cs.cr') categorySet.add(CAT.SAFETY);
      if (slug === 'cs.se') categorySet.add(CAT.CODING);
    }
  }

  return {
    itemType,
    categorySlugs: [...categorySet],
  };
}
