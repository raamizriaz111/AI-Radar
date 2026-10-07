// =============================================================================
// AI Radar — Source Repository
// =============================================================================
// Data access layer for information sources.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { type SourceRow, type Json } from '@/lib/database.types';
import {
  CreateSourceSchema,
  type CreateSourceInput,
  UpdateSourceSchema,
  type UpdateSourceInput,
} from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export interface GetSourcesOptions {
  activeOnly?: boolean;
}

export async function getSources(options: GetSourcesOptions = {}): Promise<SourceRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    let query = supabase.from('sources').select('*').order('name', { ascending: true });

    if (options.activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Failed to query sources', error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    logger.error('Unexpected error in getSources', err);
    return [];
  }
}

export async function getSourceById(id: string): Promise<SourceRow | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Failed to query source by ID', error, { sourceId: id });
      return null;
    }
    return data;
  } catch (err) {
    logger.error('Unexpected error in getSourceById', err, { sourceId: id });
    return null;
  }
}

export async function createSource(input: CreateSourceInput): Promise<SourceRow | null> {
  const validated = CreateSourceSchema.parse(input);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    logger.warn('Cannot create source: database or service key not configured');
    return null;
  }

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('sources')
      .insert({
        name: validated.name,
        source_type: validated.source_type,
        base_url: validated.base_url,
        feed_url: validated.feed_url ?? null,
        description: validated.description ?? null,
        trust_level: validated.trust_level,
        active: validated.active,
        config: (validated.config as unknown as Json) ?? {},
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to insert source', error, { name: validated.name });
      return null;
    }

    logger.info('Created new source', { id: data.id, name: data.name });
    return data;
  } catch (err) {
    logger.error('Unexpected error creating source', err, { name: validated.name });
    return null;
  }
}

export async function updateSource(id: string, input: UpdateSourceInput): Promise<SourceRow | null> {
  const validated = UpdateSourceSchema.parse(input);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    logger.warn('Cannot update source: database or service key not configured');
    return null;
  }

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('sources')
      .update({
        ...validated,
        config: validated.config ? (validated.config as unknown as Json) : undefined,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to update source', error, { sourceId: id });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error updating source', err, { sourceId: id });
    return null;
  }
}
