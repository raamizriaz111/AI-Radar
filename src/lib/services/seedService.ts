// =============================================================================
// AI Radar — Development Seed Service
// =============================================================================
// Programmatic seed runner for local development and testing.
// Injects clearly-labelled [DEV] records.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createServiceClient } from '@/lib/supabase/service';
import { createSource } from '@/lib/repositories/sourceRepository';
import { createItem } from '@/lib/repositories/itemRepository';
import { logger } from '@/lib/services/logger';

export async function runDevSeed(): Promise<{ success: boolean; message: string }> {
  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    return {
      success: false,
      message: 'Database or service key not configured in environment.',
    };
  }

  try {
    const serviceClient = createServiceClient();

    // 1. Check if seed source already exists
    const seedSource = await createSource({
      name: '[DEV] Seed Source',
      source_type: 'other',
      base_url: 'https://example-seed.invalid',
      description: 'Development seed data source. Not a real source.',
      trust_level: 3,
      active: false,
      config: { dev: true },
    });

    if (!seedSource) {
      return { success: false, message: 'Failed to create dev seed source.' };
    }

    // 2. Insert clearly-labeled sample items
    const sampleItems = [
      {
        source_id: seedSource.id,
        external_id: 'seed-item-news',
        canonical_url: 'https://example-seed.invalid/news-item',
        title: '[DEV] Example AI News Item',
        description: 'Development seed record demonstrating news categorization.',
        item_type: 'announcement' as const,
        published_at: new Date(Date.now() - 86400000).toISOString(),
        category_slugs: ['ai-news'],
        metadata: { dev: true },
      },
      {
        source_id: seedSource.id,
        external_id: 'seed-item-research',
        canonical_url: 'https://example-seed.invalid/research-item',
        title: '[DEV] Example Research Paper',
        description: 'Development seed record demonstrating research categorization.',
        item_type: 'research_paper' as const,
        published_at: new Date(Date.now() - 172800000).toISOString(),
        category_slugs: ['models'],
        metadata: { dev: true },
      },
      {
        source_id: seedSource.id,
        external_id: 'seed-item-tool',
        canonical_url: 'https://example-seed.invalid/tool-item',
        title: '[DEV] Example AI Tool',
        description: 'Development seed record demonstrating tool categorization.',
        item_type: 'tool_release' as const,
        published_at: new Date(Date.now() - 259200000).toISOString(),
        category_slugs: ['ai-tools'],
        metadata: { dev: true },
      },
    ];

    let insertedCount = 0;
    for (const item of sampleItems) {
      const res = await createItem(item);
      if (res.item && !res.isDuplicate) {
        insertedCount++;
      }
    }

    return {
      success: true,
      message: `Seed complete. Inserted ${insertedCount} new development items.`,
    };
  } catch (err) {
    logger.error('Error running dev seed', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error during seed',
    };
  }
}
