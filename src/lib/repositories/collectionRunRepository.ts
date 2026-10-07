// =============================================================================
// AI Radar — Collection Run Repository
// =============================================================================
// Data access layer for source collection job logs.
// Read by diagnostics UI, written by server-side collection routines.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { type CollectionRunRow, type Json } from '@/lib/database.types';
import {
  CreateCollectionRunSchema,
  type CreateCollectionRunInput,
  UpdateCollectionRunSchema,
  type UpdateCollectionRunInput,
} from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export async function createCollectionRun(input: CreateCollectionRunInput): Promise<CollectionRunRow | null> {
  const validated = CreateCollectionRunSchema.parse(input);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    logger.warn('Cannot record collection run: database or service key not configured');
    return null;
  }

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('collection_runs')
      .insert({
        source_id: validated.source_id,
        status: validated.status,
        started_at: validated.started_at ?? new Date().toISOString(),
        items_discovered: validated.items_discovered,
        items_created: validated.items_created,
        items_updated: validated.items_updated,
        errors: (validated.errors as unknown as Json) ?? [],
        metadata: (validated.metadata as unknown as Json) ?? {},
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create collection run record', error);
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error creating collection run', err);
    return null;
  }
}

export async function updateCollectionRun(
  id: string,
  input: UpdateCollectionRunInput
): Promise<CollectionRunRow | null> {
  const validated = UpdateCollectionRunSchema.parse(input);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    logger.warn('Cannot update collection run: database or service key not configured');
    return null;
  }

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('collection_runs')
      .update({
        ...validated,
        errors: validated.errors ? (validated.errors as unknown as Json) : undefined,
        metadata: validated.metadata ? (validated.metadata as unknown as Json) : undefined,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to update collection run', error, { runId: id });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error updating collection run', err, { runId: id });
    return null;
  }
}

export async function getLatestRuns(limit: number = 10): Promise<CollectionRunRow[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('collection_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to query latest collection runs', error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    logger.error('Unexpected error querying collection runs', err);
    return [];
  }
}
