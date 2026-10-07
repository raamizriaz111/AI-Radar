// =============================================================================
// AI Radar — Base Collector (Phase 3)
// =============================================================================
// Abstract base class shared by all source collectors.
// Handles:
//   - Collection run record creation and update
//   - Per-item deduplication via itemRepository.createItem()
//   - Consistent error aggregation and logging
//   - Safe execution: one item failure does not abort the whole run
// =============================================================================

import { createCollectionRun, updateCollectionRun } from '@/lib/repositories/collectionRunRepository';
import { createItem } from '@/lib/repositories/itemRepository';
import { logger } from '@/lib/services/logger';
import type {
  Collector,
  CollectorConfig,
  CollectorRunResult,
  NormalizedItem,
} from './types';

export abstract class BaseCollector implements Collector {
  abstract readonly slug: string;
  abstract readonly displayName: string;

  /**
   * Subclasses implement this to return normalized items from the source.
   * Should never throw — errors should be caught and returned empty.
   */
  protected abstract fetchItems(config: CollectorConfig): Promise<NormalizedItem[]>;

  /**
   * Run the full collection pipeline:
   * fetchItems → for each: createItem (with dedup) → record results
   */
  async collect(config: CollectorConfig): Promise<CollectorRunResult> {
    const startedAt = new Date().toISOString();

    logger.info(`[${this.displayName}] Starting collection run`, {
      sourceId: config.sourceId,
      maxItems: config.maxItems ?? 'unlimited',
    });

    // Create a collection_run record in DB (status: running)
    const runRecord = await createCollectionRun({
      source_id: config.sourceId,
      status: 'running',
      started_at: startedAt,
      metadata: {},
    });

    const errors: CollectorRunResult['errors'] = [];
    let itemsDiscovered = 0;
    let itemsCreated = 0;
    let itemsDuplicate = 0;
    let itemsSkipped = 0;

    let finalStatus: CollectorRunResult['status'] = 'completed';

    try {
      // 1. Fetch normalized items from source
      const items = await this.fetchItems(config);
      itemsDiscovered = items.length;

      logger.info(`[${this.displayName}] Fetched ${itemsDiscovered} items from source`);

      // 2. Store each item (with deduplication)
      for (const item of items) {
        try {
          const result = await createItem({
            source_id: config.sourceId,
            external_id: item.externalId ?? null,
            canonical_url: item.canonicalUrl,
            title: item.title,
            description: item.description ?? null,
            authors: item.authors ?? [],
            item_type: item.itemType,
            published_at: item.publishedAt ?? null,
            metadata: item.metadata ?? {},
            category_slugs: item.categorySlugs,
          });

          if (result.isDuplicate) {
            itemsDuplicate++;
          } else if (result.item) {
            itemsCreated++;
          } else {
            // createItem returned null without duplicate — insert failure
            itemsSkipped++;
            errors.push({ message: `Failed to insert item: ${item.title.slice(0, 80)}` });
          }
        } catch (err) {
          itemsSkipped++;
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ message: `Error storing item: ${msg}`, context: { title: item.title.slice(0, 80) } });
          logger.warn(`[${this.displayName}] Error storing item`, { title: item.title.slice(0, 80), error: msg });
        }
      }
    } catch (err) {
      finalStatus = 'failed';
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ message: `Collection failed: ${msg}` });
      logger.error(`[${this.displayName}] Collection failed`, err instanceof Error ? err : undefined);
    }

    // Downgrade to partial if we had errors but also successes
    if (errors.length > 0 && finalStatus === 'completed') {
      finalStatus = 'partial';
    }

    const finishedAt = new Date().toISOString();

    logger.info(`[${this.displayName}] Run complete`, {
      status: finalStatus,
      discovered: itemsDiscovered,
      created: itemsCreated,
      duplicate: itemsDuplicate,
      skipped: itemsSkipped,
    });

    // Update collection_run record
    if (runRecord) {
      await updateCollectionRun(runRecord.id, {
        status: finalStatus,
        finished_at: finishedAt,
        items_discovered: itemsDiscovered,
        items_created: itemsCreated,
        items_updated: 0,
        errors: errors.map((e) => ({ message: e.message, ...(e.context ?? {}) })),
        metadata: { itemsSkipped },
      });
    }

    return {
      sourceName: config.sourceName,
      startedAt,
      finishedAt,
      status: finalStatus,
      itemsDiscovered,
      itemsCreated,
      itemsDuplicate,
      itemsSkipped,
      errors,
    };
  }
}
