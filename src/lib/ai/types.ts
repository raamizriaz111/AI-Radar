// =============================================================================
// AI Radar — AI Provider & Enrichment Types (Phase 4)
// =============================================================================
// Defines the contract for AI provider adapters, prompt templates,
// and structured enrichment output.
// =============================================================================

import type { AIEnrichmentOutput } from '@/lib/validation/schemas';
import type { ItemFull } from '@/lib/database.types';

export interface EnrichmentInput {
  item: ItemFull;
  /** Cleaned content to send to the model */
  sourceContent: string;
  /** Force re-enrichment even if a summary already exists */
  forceRegenerate?: boolean;
}

export interface ProviderUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface EnrichmentResult {
  ok: boolean;
  output?: AIEnrichmentOutput;
  provider: string;
  model: string;
  promptVersion: string;
  usage?: ProviderUsage;
  error?: string;
  durationMs: number;
}

export interface AIProvider {
  readonly id: string;
  readonly displayName: string;
  readonly defaultModel: string;

  /**
   * Generates structured enrichment for a single item.
   * Guaranteed to validate the output before returning.
   */
  enrich(input: EnrichmentInput): Promise<EnrichmentResult>;

  /**
   * Health check / ping to verify connectivity.
   */
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}

export interface BatchEnrichmentOptions {
  limit?: number;
  delayMs?: number;
  forceRegenerate?: boolean;
  categorySlug?: string;
}

export interface BatchEnrichmentResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  durationMs: number;
  items: Array<{
    id: string;
    title: string;
    status: 'completed' | 'failed' | 'skipped';
    error?: string;
  }>;
}
