// =============================================================================
// AI Radar — OpenAI Provider Adapter (Phase 4)
// =============================================================================
// Connects to OpenAI API using native fetch and JSON mode.
// Features:
//   - Configurable model (defaults to gpt-4o-mini for cost control)
//   - Native timeout via AbortController
//   - Strict secret handling (API key read server-side only)
//   - Token usage tracking and rate limit backoff
// =============================================================================

import { BaseAIProvider } from './base';
import { logger } from '@/lib/services/logger';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider extends BaseAIProvider {
  readonly id = 'openai';
  readonly displayName = 'OpenAI';
  readonly defaultModel = 'gpt-4o-mini';

  private getApiKey(): string | null {
    return process.env.OPENAI_API_KEY || process.env.AI_API_KEY || null;
  }

  protected async executeRawCompletion(
    systemPrompt: string,
    userPrompt: string,
    modelName: string
  ): Promise<{ rawText: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in .env.local');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2, // low temperature for factual precision
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[OpenAI] API request failed', undefined, {
          status: response.status,
          statusText: response.statusText,
        });

        if (response.status === 429) {
          throw new Error('OpenAI rate limit or quota exceeded (HTTP 429)');
        }
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key (HTTP 401)');
        }
        throw new Error(`OpenAI error HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const json = await response.json();
      const choice = json.choices?.[0];
      const rawText = choice?.message?.content;

      if (!rawText) {
        throw new Error('OpenAI returned empty message content');
      }

      return {
        rawText,
        usage: {
          promptTokens: json.usage?.prompt_tokens,
          completionTokens: json.usage?.completion_tokens,
          totalTokens: json.usage?.total_tokens,
        },
      };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('OpenAI API request timed out after 30s');
      }
      throw err;
    }
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { ok: false, message: 'OPENAI_API_KEY not configured' };
    }
    return { ok: true, message: 'OpenAI API key configured and ready' };
  }
}

export const openAIProvider = new OpenAIProvider();
