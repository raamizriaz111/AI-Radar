// =============================================================================
// AI Radar — Provider Registry & Factory (Phase 4)
// =============================================================================
// Resolves the active AI provider based on environment configuration.
// Never exposes credentials. Supports graceful fallback to mock mode.
// =============================================================================

import { openAIProvider } from './openai';
import { geminiProvider } from './gemini';
import { mockAIProvider } from './mock';
import type { AIProvider } from '../types';

export const PROVIDER_REGISTRY: Record<string, AIProvider> = {
  [openAIProvider.id]: openAIProvider,
  [geminiProvider.id]: geminiProvider,
  [mockAIProvider.id]: mockAIProvider,
};

/**
 * Returns the currently active AI provider.
 * Priority:
 *   1. Explicit AI_PROVIDER environment variable
 *   2. OpenAI if OPENAI_API_KEY is present
 *   3. Gemini if GOOGLE_AI_API_KEY or GEMINI_API_KEY is present
 *   4. Fallback to mockAIProvider (heuristic mode)
 */
export function getAIProvider(): AIProvider {
  const configuredProvider = process.env.AI_PROVIDER?.toLowerCase();

  if (configuredProvider && PROVIDER_REGISTRY[configuredProvider]) {
    return PROVIDER_REGISTRY[configuredProvider];
  }

  if (process.env.OPENAI_API_KEY || process.env.AI_API_KEY) {
    return openAIProvider;
  }

  if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
    return geminiProvider;
  }

  // Default fallback: mock/heuristic provider (allows offline dev & tests)
  return mockAIProvider;
}

/**
 * Lists all registered AI providers with their configuration status.
 */
export async function getProviderStatuses(): Promise<Array<{
  id: string;
  displayName: string;
  defaultModel: string;
  isCurrent: boolean;
  isReady: boolean;
  statusMessage: string;
}>> {
  const current = getAIProvider();
  const statuses = [];

  for (const provider of Object.values(PROVIDER_REGISTRY)) {
    const check = await provider.healthCheck();
    statuses.push({
      id: provider.id,
      displayName: provider.displayName,
      defaultModel: provider.defaultModel,
      isCurrent: provider.id === current.id,
      isReady: check.ok,
      statusMessage: check.message,
    });
  }

  return statuses;
}
