// =============================================================================
// AI Radar — Base AI Provider (Phase 4)
// =============================================================================
// Abstract base class for all AI provider adapters.
// Features:
//   - Output validation using Zod (AIEnrichmentOutputSchema)
//   - Controlled retries on transient errors (429, 500, 503)
//   - JSON parsing recovery
//   - Timing and error redaction
// =============================================================================

import { AIEnrichmentOutputSchema, type AIEnrichmentOutput } from '@/lib/validation/schemas';
import { logger } from '@/lib/services/logger';
import { CURRENT_PROMPT_VERSION, ENRICHMENT_SYSTEM_PROMPT, buildEnrichmentUserPrompt } from '../prompts';
import { formatSourceDocument } from '../sanitizer';
import type { AIProvider, EnrichmentInput, EnrichmentResult } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly id: string;
  abstract readonly displayName: string;
  abstract readonly defaultModel: string;

  /**
   * Subclasses implement raw LLM request execution.
   * Should return the raw JSON text response from the model.
   */
  protected abstract executeRawCompletion(
    systemPrompt: string,
    userPrompt: string,
    modelName: string
  ): Promise<{ rawText: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }>;

  async enrich(input: EnrichmentInput): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const model = process.env.AI_MODEL || this.defaultModel;

    try {
      const formattedDoc = formatSourceDocument({
        title: input.item.title,
        sourceName: input.item.source?.name ?? 'Unknown Source',
        url: input.item.canonical_url,
        publishedAt: input.item.published_at,
        authors: Array.isArray(input.item.authors) ? (input.item.authors as string[]) : [],
        content: input.sourceContent || input.item.description || input.item.title,
      });

      const userPrompt = buildEnrichmentUserPrompt(formattedDoc);

      logger.info(`[${this.displayName}] Generating enrichment`, {
        itemId: input.item.id,
        model,
        promptVersion: CURRENT_PROMPT_VERSION,
      });

      // Execute with provider-specific logic
      const { rawText, usage } = await this.executeRawCompletion(
        ENRICHMENT_SYSTEM_PROMPT,
        userPrompt,
        model
      );

      // Parse JSON safely
      const parsedJson = this.extractAndParseJson(rawText);

      // Validate against strict Zod schema
      const validated: AIEnrichmentOutput = AIEnrichmentOutputSchema.parse(parsedJson);

      const durationMs = Date.now() - startTime;
      logger.info(`[${this.displayName}] Enrichment successful`, {
        itemId: input.item.id,
        durationMs,
        claimsExtracted: validated.claims.length,
      });

      return {
        ok: true,
        output: validated,
        provider: this.id,
        model,
        promptVersion: CURRENT_PROMPT_VERSION,
        usage: {
          ...usage,
          estimatedCostUsd: this.estimateCost(model, usage?.promptTokens, usage?.completionTokens),
        },
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[${this.displayName}] Enrichment failed`, err, {
        itemId: input.item.id,
        durationMs,
      });

      return {
        ok: false,
        error: message,
        provider: this.id,
        model,
        promptVersion: CURRENT_PROMPT_VERSION,
        durationMs,
      };
    }
  }

  /**
   * Robust JSON extraction that handles markdown backtick wraps (```json ... ```)
   */
  protected extractAndParseJson(text: string): unknown {
    let cleaned = text.trim();

    // Strip markdown code fences if model returned them
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      // Attempt substring extraction if model added preamble
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = cleaned.slice(firstBrace, lastBrace + 1);
        return JSON.parse(candidate);
      }
      throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 100)}...`);
    }
  }

  /**
   * Cost estimation helper (approximate standard rates per 1M tokens)
   */
  protected estimateCost(model: string, promptTokens?: number, completionTokens?: number): number {
    if (!promptTokens && !completionTokens) return 0;
    const pTokens = promptTokens ?? 0;
    const cTokens = completionTokens ?? 0;

    // gpt-4o-mini rates: ~$0.15 / 1M prompt, $0.60 / 1M completion
    if (model.includes('mini') || model.includes('flash')) {
      return (pTokens * 0.00000015) + (cTokens * 0.00000060);
    }
    // standard rates: ~$2.50 / 1M prompt, $10.00 / 1M completion
    return (pTokens * 0.0000025) + (cTokens * 0.000010);
  }

  abstract healthCheck(): Promise<{ ok: boolean; message: string }>;
}
