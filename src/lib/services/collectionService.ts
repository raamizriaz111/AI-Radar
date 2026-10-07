// =============================================================================
// AI Radar — Collection Orchestrator Service (Phase 3)
// =============================================================================
// Coordinates running one or all collectors.
// Resolves source IDs from DB before running each collector.
// A failure in one source does not block others.
// =============================================================================

import { getSources, createSource } from '@/lib/repositories/sourceRepository';
import { getCollector, listCollectors } from '@/lib/collectors/registry';
import { logger } from '@/lib/services/logger';
import type { CollectorRunResult } from '@/lib/collectors/types';
import type { SourceRow } from '@/lib/database.types';

export interface OrchestratorResult {
  ran: number;
  results: CollectorRunResult[];
  skipped: string[];
  totalCreated: number;
  totalDiscovered: number;
}

const DEFAULT_SOURCE_CONFIGS: Record<string, Parameters<typeof createSource>[0]> = {
  'world-ai-news': {
    name: 'World AI News',
    source_type: 'news',
    base_url: 'https://news.google.com',
    feed_url: 'https://news.google.com/rss/search?q=Artificial+Intelligence&hl=en-US&gl=US&ceid=US:en',
    description: 'Latest real-world AI news from mainstream news publications (BBC, CBS, Reuters, NYT, Bloomberg, TechCrunch).',
    trust_level: 1,
    active: true,
    config: { slug: 'world-ai-news' },
  },
  'arxiv': {
    name: 'arXiv AI/ML',
    source_type: 'research',
    base_url: 'https://arxiv.org',
    feed_url: 'https://export.arxiv.org/api/query',
    description: 'arXiv AI and Machine Learning research papers.',
    trust_level: 1,
    active: true,
    config: { slug: 'arxiv', subjects: ['cs.AI', 'cs.LG', 'cs.CL'] },
  },
  'huggingface-papers': {
    name: 'Hugging Face Papers',
    source_type: 'database',
    base_url: 'https://huggingface.co/papers',
    feed_url: 'https://huggingface.co/papers.rss',
    description: 'Hugging Face daily featured AI research papers.',
    trust_level: 1,
    active: true,
    config: { slug: 'huggingface-papers' },
  },
  'github': {
    name: 'GitHub AI Repositories',
    source_type: 'repository',
    base_url: 'https://github.com',
    feed_url: 'https://api.github.com/search/repositories',
    description: 'Trending and recently created open-source AI projects on GitHub.',
    trust_level: 2,
    active: true,
    config: { slug: 'github' },
  },
};

/**
 * Ensures a source exists in the DB for a given slug.
 * If not present, creates it from DEFAULT_SOURCE_CONFIGS.
 */
async function resolveOrCreateSource(slug: string): Promise<SourceRow | null> {
  const sources = await getSources({ activeOnly: true });
  let source = sources.find((s) => {
    const config = s.config as Record<string, unknown> | null;
    return config && config['slug'] === slug;
  });

  if (!source && DEFAULT_SOURCE_CONFIGS[slug]) {
    logger.info(`[Orchestrator] Source not found for slug "${slug}". Auto-creating default source.`);
    source = (await createSource(DEFAULT_SOURCE_CONFIGS[slug])) ?? undefined;
  }

  return source ?? null;
}

/**
 * Run a specific collector by its slug.
 * Looks up or seeds the source row in DB to get its ID.
 */
export async function runCollector(slug: string): Promise<CollectorRunResult | null> {
  const collector = getCollector(slug);
  if (!collector) {
    logger.warn(`[Orchestrator] No collector found for slug: ${slug}`);
    return null;
  }

  const source = await resolveOrCreateSource(slug);

  if (!source) {
    logger.warn(`[Orchestrator] Source not found in DB for slug: ${slug}. Run migration 004 first.`);
    return null;
  }

  logger.info(`[Orchestrator] Running collector: ${collector.displayName}`, {
    sourceId: source.id,
    sourceName: source.name,
  });

  const result = await collector.collect({
    sourceId: source.id,
    sourceName: source.name,
    maxItems: 60,
    timeoutMs: 20_000,
    maxRetries: 2,
  });

  return result;
}

/**
 * Run all registered collectors sequentially.
 * Each collector runs independently — one failure does not block others.
 */
export async function runAllCollectors(): Promise<OrchestratorResult> {
  const collectors = listCollectors();

  const results: CollectorRunResult[] = [];
  const skipped: string[] = [];
  let ran = 0;

  for (const collector of collectors) {
    const source = await resolveOrCreateSource(collector.slug);

    if (!source) {
      logger.warn(`[Orchestrator] Skipping ${collector.displayName} — no DB source row found for slug "${collector.slug}"`);
      skipped.push(collector.slug);
      continue;
    }

    try {
      logger.info(`[Orchestrator] Running collector: ${collector.displayName}`);
      const result = await collector.collect({
        sourceId: source.id,
        sourceName: source.name,
        maxItems: 60,
        timeoutMs: 20_000,
        maxRetries: 2,
      });
      results.push(result);
      ran++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[Orchestrator] Unexpected error from ${collector.displayName}`, err instanceof Error ? err : undefined);
      results.push({
        sourceName: source.name,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        status: 'failed',
        itemsDiscovered: 0,
        itemsCreated: 0,
        itemsDuplicate: 0,
        itemsSkipped: 0,
        errors: [{ message: msg }],
      });
      ran++;
    }
  }

  const totalCreated = results.reduce((sum, r) => sum + r.itemsCreated, 0);
  const totalDiscovered = results.reduce((sum, r) => sum + r.itemsDiscovered, 0);

  logger.info(`[Orchestrator] All runs complete`, { ran, skipped: skipped.length, totalCreated, totalDiscovered });

  return { ran, results, skipped, totalCreated, totalDiscovered };
}
