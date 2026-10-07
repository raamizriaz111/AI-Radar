// =============================================================================
// AI Radar — AI Enrichment Orchestration Service (Phase 4)
// =============================================================================
// Coordinates single-item and batch AI enrichment:
//   1. Duplicate prevention: Checks for existing summaries before API call
//   2. Input preparation: Cleans and sanitizes source content
//   3. Provider delegation: Dispatches to active AIProvider
//   4. Validation: Enforces schema adherence
//   5. Persistence: Stores output in summaries table; updates item status
//   6. Rate limit pacing: Delay between batch items
// =============================================================================

import { getItemById, updateItemEnrichmentStatus, getItemsPendingEnrichment } from '@/lib/repositories/itemRepository';
import { createSummary, getSummaryByItemId } from '@/lib/repositories/summaryRepository';
import { getAIProvider } from './providers';
import { sanitizeSourceText } from './sanitizer';
import { CURRENT_PROMPT_VERSION } from './prompts';
import { logger } from '@/lib/services/logger';
import type {
  EnrichmentResult,
  BatchEnrichmentOptions,
  BatchEnrichmentResult,
} from './types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enriches a single item by ID.
 * Prevents redundant processing unless forceRegenerate is true.
 */
export async function enrichItemById(
  itemId: string,
  options: { forceRegenerate?: boolean } = {}
): Promise<EnrichmentResult> {
  const startTime = Date.now();
  const provider = getAIProvider();

  // 1. Fetch item
  const item = await getItemById(itemId);
  if (!item) {
    return {
      ok: false,
      error: `Item not found: ${itemId}`,
      provider: provider.id,
      model: provider.defaultModel,
      promptVersion: CURRENT_PROMPT_VERSION,
      durationMs: Date.now() - startTime,
    };
  }

  // 2. Duplicate prevention check
  if (!options.forceRegenerate) {
    const existingSummary = await getSummaryByItemId(itemId);
    if (existingSummary) {
      logger.info('[EnrichmentService] Skipping item: already enriched', { itemId });
      await updateItemEnrichmentStatus(itemId, 'completed');
      return {
        ok: true,
        provider: existingSummary.provider,
        model: existingSummary.model_name,
        promptVersion: CURRENT_PROMPT_VERSION,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // 3. Mark item status as processing
  await updateItemEnrichmentStatus(itemId, 'processing');

  // 4. Prepare sanitized content
  const rawContent = item.content_text || item.description || item.title;
  const sourceContent = sanitizeSourceText(rawContent);

  // 5. Invoke provider
  const result = await provider.enrich({
    item,
    sourceContent,
    forceRegenerate: options.forceRegenerate,
  });

  if (!result.ok || !result.output) {
    logger.warn('[EnrichmentService] Enrichment failed for item', { itemId, error: result.error });
    await updateItemEnrichmentStatus(itemId, 'failed', result.error ?? 'Unknown error');
    return result;
  }

  // 6. Save validated summary to database
  const savedSummary = await createSummary({
    item_id: item.id,
    model_name: result.model,
    provider: result.provider,
    summary: result.output.summary,
    key_points: result.output.key_points,
    significance: result.output.significance,
    claims: result.output.claims,
    confidence: result.output.confidence,
    entities: result.output.entities,
    technologies: result.output.technologies,
    topics: result.output.topics,
    suggested_categories: result.output.suggested_categories,
    suggested_item_type: result.output.suggested_item_type,
    prompt_version: result.promptVersion,
    warning_flags: result.output.warning_flags,
    usage: (result.usage as Record<string, unknown>) ?? {},
  });

  if (!savedSummary) {
    await updateItemEnrichmentStatus(itemId, 'failed', 'Database write failed');
    return {
      ...result,
      ok: false,
      error: 'Failed to persist summary in database',
    };
  }

  // 7. Update item status to completed
  await updateItemEnrichmentStatus(itemId, 'completed');
  logger.info('[EnrichmentService] Successfully enriched and stored item', { itemId });

  return result;
}

/**
 * Runs controlled batch enrichment on candidate un-enriched items.
 * Uses request pacing to avoid rate limits.
 */
export async function enrichBatch(
  options: BatchEnrichmentOptions = {}
): Promise<BatchEnrichmentResult> {
  const startTime = Date.now();
  const limit = Math.min(options.limit ?? 5, 20); // soft cap for cost protection
  const delayMs = options.delayMs ?? 600; // request pacing delay

  logger.info('[EnrichmentService] Starting batch enrichment', { limit });

  // Fetch candidate items
  const candidates = await getItemsPendingEnrichment(limit);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const itemResults: BatchEnrichmentResult['items'] = [];

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];

    if (i > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    try {
      const res = await enrichItemById(item.id, {
        forceRegenerate: options.forceRegenerate,
      });

      if (res.ok) {
        succeeded++;
        itemResults.push({ id: item.id, title: item.title, status: 'completed' });
      } else {
        failed++;
        itemResults.push({ id: item.id, title: item.title, status: 'failed', error: res.error });
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      itemResults.push({ id: item.id, title: item.title, status: 'failed', error: msg });
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info('[EnrichmentService] Batch enrichment completed', {
    processed: candidates.length,
    succeeded,
    failed,
    skipped,
    durationMs,
  });

  return {
    processed: candidates.length,
    succeeded,
    failed,
    skipped,
    durationMs,
    items: itemResults,
  };
}
