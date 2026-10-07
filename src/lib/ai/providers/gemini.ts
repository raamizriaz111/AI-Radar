// =============================================================================
// AI Radar — Google Gemini Provider Adapter (Phase 4)
// =============================================================================
// Connects to Google Generative Language API using native fetch and JSON mode.
// Features:
//   - Configurable model (defaults to gemini-1.5-flash for cost & speed)
//   - Native timeout via AbortController
//   - JSON mime-type response enforcement
//   - Strict secret handling (API key read server-side only)
// =============================================================================

import { BaseAIProvider } from './base';
import { logger } from '@/lib/services/logger';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider extends BaseAIProvider {
  readonly id = 'gemini';
  readonly displayName = 'Google Gemini';
  readonly defaultModel = 'gemini-1.5-flash';

  private getApiKey(): string | null {
    return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || null;
  }

  protected async executeRawCompletion(
    systemPrompt: string,
    userPrompt: string,
    modelName: string
  ): Promise<{ rawText: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured in .env.local');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 1500,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[Gemini] API request failed', undefined, {
          status: response.status,
          statusText: response.statusText,
        });

        if (response.status === 429) {
          throw new Error('Gemini rate limit or quota exceeded (HTTP 429)');
        }
        throw new Error(`Gemini error HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini returned empty candidate content');
      }

      return {
        rawText,
        usage: {
          promptTokens: json.usageMetadata?.promptTokenCount,
          completionTokens: json.usageMetadata?.candidatesTokenCount,
          totalTokens: json.usageMetadata?.totalTokenCount,
        },
      };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Gemini API request timed out after 30s');
      }
      throw err;
    }
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { ok: false, message: 'GOOGLE_AI_API_KEY not configured' };
    }
    return { ok: true, message: 'Google Gemini API key configured and ready' };
  }
}

export const geminiProvider = new GeminiProvider();
