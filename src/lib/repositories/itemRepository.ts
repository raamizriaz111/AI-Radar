// =============================================================================
// AI Radar — Item Repository
// =============================================================================
// Data access layer for original information records (sources -> items).
// Enforces deduplication and separates source data from AI summaries.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  type ItemRow,
  type ItemFull,
  type PaginatedResult,
  type Json,
} from '@/lib/database.types';
import {
  CreateItemSchema,
  type CreateItemInput,
  type ItemsQueryFilter,
  ItemsQueryFilterSchema,
} from '@/lib/validation/schemas';
import { computeContentHash } from '@/lib/services/hash';
import { logger } from '@/lib/services/logger';

export async function findItemByCanonicalUrl(canonicalUrl: string): Promise<ItemRow | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('canonical_url', canonicalUrl.trim())
      .maybeSingle();

    if (error) {
      logger.error('Error finding item by canonical URL', error);
      return null;
    }
    return data;
  } catch (err) {
    logger.error('Unexpected error finding item by canonical URL', err);
    return null;
  }
}

export async function findItemByExternalId(sourceId: string, externalId: string): Promise<ItemRow | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('source_id', sourceId)
      .eq('external_id', externalId.trim())
      .maybeSingle();

    if (error) {
      logger.error('Error finding item by external ID', error);
      return null;
    }
    return data;
  } catch (err) {
    logger.error('Unexpected error finding item by external ID', err);
    return null;
  }
}

export async function findItemByContentHash(contentHash: string): Promise<ItemRow | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (error) {
      logger.error('Error finding item by content hash', error);
      return null;
    }
    return data;
  } catch (err) {
    logger.error('Unexpected error finding item by content hash', err);
    return null;
  }
}

export async function createItem(input: CreateItemInput): Promise<{ item: ItemRow | null; isDuplicate: boolean }> {
  const validated = CreateItemSchema.parse(input);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    logger.warn('Cannot create item: database or service key not configured');
    return { item: null, isDuplicate: false };
  }

  // 1. Deduplication checks
  // Check canonical URL
  const existingByUrl = await findItemByCanonicalUrl(validated.canonical_url);
  if (existingByUrl) {
    logger.info('Duplicate skipped by canonical URL', { url: validated.canonical_url, existingId: existingByUrl.id });
    return { item: existingByUrl, isDuplicate: true };
  }

  // Check source + external ID
  if (validated.external_id) {
    const existingByExtId = await findItemByExternalId(validated.source_id, validated.external_id);
    if (existingByExtId) {
      logger.info('Duplicate skipped by external ID', { externalId: validated.external_id, existingId: existingByExtId.id });
      return { item: existingByExtId, isDuplicate: true };
    }
  }

  // Compute content hash if not provided
  const contentHash = validated.content_hash ?? computeContentHash({
    canonicalUrl: validated.canonical_url,
    title: validated.title,
    description: validated.description,
  });

  const existingByHash = await findItemByContentHash(contentHash);
  if (existingByHash) {
    logger.info('Duplicate skipped by content hash', { hash: contentHash, existingId: existingByHash.id });
    return { item: existingByHash, isDuplicate: true };
  }

  try {
    const serviceClient = createServiceClient();

    // 2. Insert item
    const { data: item, error: itemError } = await serviceClient
      .from('items')
      .insert({
        source_id: validated.source_id,
        external_id: validated.external_id ?? null,
        canonical_url: validated.canonical_url,
        title: validated.title,
        description: validated.description ?? null,
        content_text: validated.content_text ?? null,
        authors: validated.authors,
        item_type: validated.item_type,
        published_at: validated.published_at ?? null,
        discovered_at: validated.discovered_at ?? new Date().toISOString(),
        content_hash: contentHash,
        metadata: (validated.metadata as unknown as Json) ?? {},
      })
      .select('*')
      .single();

    if (itemError || !item) {
      logger.error('Failed to insert item', itemError);
      return { item: null, isDuplicate: false };
    }

    // 3. Connect categories if any specified
    if (validated.category_slugs && validated.category_slugs.length > 0) {
      const { data: categories } = await serviceClient
        .from('categories')
        .select('id, slug')
        .in('slug', validated.category_slugs);

      if (categories && categories.length > 0) {
        const joinRecords = categories.map((cat) => ({
          item_id: item.id,
          category_id: cat.id,
        }));

        await serviceClient.from('item_categories').insert(joinRecords);
      }
    }

    logger.info('Inserted new item', { id: item.id, title: item.title });
    return { item, isDuplicate: false };
  } catch (err) {
    logger.error('Unexpected error inserting item', err);
    return { item: null, isDuplicate: false };
  }
}

export const queryItems = getItems;

export async function getItems(filterInput: Partial<ItemsQueryFilter> = {}): Promise<PaginatedResult<ItemFull>> {
  const filter = ItemsQueryFilterSchema.parse(filterInput);

  if (!isDatabaseConfigured()) {
    return {
      data: [],
      total: 0,
      page: filter.page,
      pageSize: filter.pageSize,
      hasMore: false,
    };
  }

  try {
    const supabase = await createClient();
    const offset = (filter.page - 1) * filter.pageSize;

    // Build query with category inner join filter if categorySlug is provided
    const selectQuery = filter.categorySlug
      ? `
        *,
        source:sources (*),
        item_categories!inner (
          category:categories!inner (*)
        ),
        summaries (*)
      `
      : `
        *,
        source:sources (*),
        item_categories (
          category:categories (*)
        ),
        summaries (*)
      `;

    let query = supabase.from('items').select(selectQuery, { count: 'exact' });

    if (filter.categorySlug) {
      query = query.eq('item_categories.category.slug', filter.categorySlug);
    }

    if (filter.itemType) {
      query = query.eq('item_type', filter.itemType);
    }

    if (filter.sourceId) {
      query = query.eq('source_id', filter.sourceId);
    }

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.trim();
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    query = query
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + filter.pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Failed to fetch items', error);
      return {
        data: [],
        total: 0,
        page: filter.page,
        pageSize: filter.pageSize,
        hasMore: false,
      };
    }

    // If categorySlug was filtered via !inner join, hydrate all other category tags for returned items
    const fullCategoriesByItem: Record<string, any[]> = {};
    if (filter.categorySlug && data && data.length > 0) {
      const itemIds = data.map((row: any) => row.id);
      const { data: allCats } = await supabase
        .from('item_categories')
        .select('item_id, category:categories(*)')
        .in('item_id', itemIds);

      if (allCats) {
        for (const ac of allCats) {
          if (!fullCategoriesByItem[ac.item_id]) fullCategoriesByItem[ac.item_id] = [];
          if (ac.category) fullCategoriesByItem[ac.item_id].push(ac.category);
        }
      }
    }

    // Map and transform data into ItemFull shape
    const items: ItemFull[] = (data || []).map((row: any) => {
      const categories = (
        filter.categorySlug && fullCategoriesByItem[row.id]
          ? fullCategoriesByItem[row.id]
          : (row.item_categories || [])
              .map((ic: any) => ic.category)
      ).filter(Boolean);

      const summary = row.summaries && row.summaries.length > 0 ? row.summaries[0] : null;

      return {
        id: row.id,
        source_id: row.source_id,
        external_id: row.external_id,
        canonical_url: row.canonical_url,
        title: row.title,
        description: row.description,
        content_text: row.content_text,
        authors: row.authors,
        item_type: row.item_type,
        published_at: row.published_at,
        discovered_at: row.discovered_at,
        content_hash: row.content_hash,
        metadata: row.metadata,
        enrichment_status: row.enrichment_status ?? 'pending',
        enrichment_error: row.enrichment_error ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        source: row.source,
        categories,
        summary,
      };
    });

    const totalCount = count ?? items.length;

    return {
      data: items,
      total: totalCount,
      page: filter.page,
      pageSize: filter.pageSize,
      hasMore: offset + items.length < totalCount,
    };
  } catch (err) {
    logger.error('Unexpected error fetching items', err);
    return {
      data: [],
      total: 0,
      page: filter.page,
      pageSize: filter.pageSize,
      hasMore: false,
    };
  }
}

export async function getItemById(id: string): Promise<ItemFull | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('items')
      .select(`
        *,
        source:sources (*),
        item_categories (
          category:categories (*)
        ),
        summaries (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !row) {
      if (error) logger.error('Failed to get item by ID', error, { id });
      return null;
    }

    const categories = ((row as any).item_categories || [])
      .map((ic: any) => ic.category)
      .filter(Boolean);
    const summary = (row as any).summaries && (row as any).summaries.length > 0 ? (row as any).summaries[0] : null;

    return {
      ...(row as any),
      enrichment_status: (row as any).enrichment_status ?? 'pending',
      enrichment_error: (row as any).enrichment_error ?? null,
      categories,
      summary,
    };
  } catch (err) {
    logger.error('Unexpected error getting item by ID', err, { id });
    return null;
  }
}

/**
 * Updates the AI enrichment status and optional error message on an item.
 * Gracefully ignores column errors if migration 005 has not been executed yet.
 */
export async function updateItemEnrichmentStatus(
  itemId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped',
  errorMessage?: string | null
): Promise<boolean> {
  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) return false;

  try {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('items')
      .update({
        enrichment_status: status,
        enrichment_error: errorMessage ?? null,
      })
      .eq('id', itemId);

    if (error) {
      if (error.message && error.message.includes('column')) {
        // Migration 005 has not run yet — harmlessly log without throwing
        logger.warn('items table missing enrichment_status column. Run migration 005.');
        return false;
      }
      logger.error('Failed to update item enrichment status', error, { itemId, status });
      return false;
    }

    return true;
  } catch (err) {
    logger.error('Unexpected error updating item enrichment status', err, { itemId });
    return false;
  }
}

/**
 * Fetches items that do not yet have an AI summary.
 * Prioritizes recent items without summaries.
 */
export async function getItemsPendingEnrichment(limit = 10): Promise<ItemFull[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const supabase = await createClient();

    // Query items along with their summaries and relations
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        source:sources (*),
        item_categories (
          category:categories (*)
        ),
        summaries (*)
      `)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit * 3); // fetch slightly larger pool to filter in memory

    if (error || !data) {
      logger.error('Failed to fetch candidate items for enrichment', error);
      return [];
    }

    // Filter to items that have NO summaries attached
    const unsummarized = data.filter((row: any) => !row.summaries || row.summaries.length === 0);

    return unsummarized.slice(0, limit).map((row: any) => {
      const categories = (row.item_categories || [])
        .map((ic: any) => ic.category)
        .filter(Boolean);

      return {
        id: row.id,
        source_id: row.source_id,
        external_id: row.external_id,
        canonical_url: row.canonical_url,
        title: row.title,
        description: row.description,
        content_text: row.content_text,
        authors: row.authors,
        item_type: row.item_type,
        published_at: row.published_at,
        discovered_at: row.discovered_at,
        content_hash: row.content_hash,
        metadata: row.metadata,
        enrichment_status: row.enrichment_status ?? 'pending',
        enrichment_error: row.enrichment_error ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        source: row.source,
        categories,
        summary: null,
      } as ItemFull;
    });
  } catch (err) {
    logger.error('Unexpected error in getItemsPendingEnrichment', err);
    return [];
  }
}
