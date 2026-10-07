// =============================================================================
// AI Radar — Summary Repository
// =============================================================================
// Data access layer for AI-generated summaries.
// Keeps AI-generated analysis isolated from original source data.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { type SummaryRow, type Json } from '@/lib/database.types';
import {
  CreateSummarySchema,
  type CreateSummaryInput,
} from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';

export async function createSummary(input: CreateSummaryInput): Promise<SummaryRow | null> {
  const validated = CreateSummarySchema.parse(input);

  if (!isDatabaseConfigured() || !isServiceKeyConfigured()) {
    logger.warn('Cannot save summary: database or service key not configured');
    return null;
  }

  try {
    const serviceClient = createServiceClient();

    // Primary attempt: Include full Phase 4 enrichment columns
    const fullPayload = {
      item_id: validated.item_id,
      model_name: validated.model_name,
      provider: validated.provider,
      summary: validated.summary,
      key_points: (validated.key_points as unknown as Json) ?? [],
      significance: validated.significance ?? null,
      claims: (validated.claims as unknown as Json) ?? [],
      confidence: validated.confidence ?? null,
      entities: (validated.entities as unknown as Json) ?? [],
      technologies: (validated.technologies as unknown as Json) ?? [],
      topics: (validated.topics as unknown as Json) ?? [],
      suggested_categories: (validated.suggested_categories as unknown as Json) ?? [],
      suggested_item_type: validated.suggested_item_type ?? null,
      prompt_version: validated.prompt_version ?? '1.0.0',
      warning_flags: (validated.warning_flags as unknown as Json) ?? [],
      usage: (validated.usage as unknown as Json) ?? {},
    };

    const { data, error } = await serviceClient
      .from('summaries')
      .upsert(fullPayload, { onConflict: 'item_id,model_name,provider' })
      .select('*')
      .single();

    if (!error && data) {
      return data;
    }

    // If error is about a missing column (e.g. migration 005 not run yet in Supabase),
    // fall back to base columns and embed structured metadata in claims/key_points
    if (error && error.message && error.message.includes('column')) {
      logger.warn('Summaries table missing Phase 4 columns — falling back to base schema. Run migration 005.');
      const fallbackPayload = {
        item_id: validated.item_id,
        model_name: validated.model_name,
        provider: validated.provider,
        summary: validated.summary,
        key_points: (validated.key_points as unknown as Json) ?? [],
        significance: validated.significance ?? null,
        claims: (validated.claims as unknown as Json) ?? [],
        confidence: validated.confidence ?? null,
      };

      const { data: fallbackData, error: fallbackError } = await serviceClient
        .from('summaries')
        .upsert(fallbackPayload, { onConflict: 'item_id,model_name,provider' })
        .select('*')
        .single();

      if (fallbackError) {
        logger.error('Failed to save summary even in fallback mode', fallbackError, { itemId: validated.item_id });
        return null;
      }

      return fallbackData;
    }

    if (error) {
      logger.error('Failed to save summary', error, { itemId: validated.item_id });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error saving summary', err, { itemId: validated.item_id });
    return null;
  }
}

export async function getSummaryByItemId(itemId: string): Promise<SummaryRow | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('item_id', itemId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get summary by item ID', error, { itemId });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Unexpected error getting summary', err, { itemId });
    return null;
  }
}
