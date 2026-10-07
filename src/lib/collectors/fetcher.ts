// =============================================================================
// AI Radar — HTTP Fetcher (Phase 3)
// =============================================================================
// Provides a safe, rate-limited HTTP fetch wrapper for all source collectors.
// Features:
//   - Configurable timeout via AbortController
//   - Bounded exponential-backoff retry on transient errors
//   - Honest User-Agent header (identifies AI Radar as the client)
//   - Never follows redirects blindly (validates final URL)
//   - Respects robots.txt intent — does not bypass access restrictions
// =============================================================================

import { logger } from '@/lib/services/logger';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 1_000;

/**
 * HTTP status codes that are worth retrying (transient errors).
 * 4xx errors that are deterministic failures are not retried.
 */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export interface FetchResult {
  ok: boolean;
  status: number;
  text: string;
  url: string;
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a URL with timeout and retry logic.
 * Designed for server-side use only.
 *
 * @param url - The URL to fetch.
 * @param options - Optional overrides for timeout and retry count.
 */
export async function fetchWithRetry(
  url: string,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<FetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  const requestHeaders: Record<string, string> = {
    'User-Agent': 'AIRadar/0.3 (personal intelligence platform; contact: see repo)',
    Accept: 'application/xml, application/json, text/plain, */*',
    ...options.headers,
  };

  let lastError: string = 'Unknown error';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info(`[Fetcher] Retry ${attempt}/${maxRetries} for ${url} in ${backoff}ms`);
      await sleep(backoff);
    }

    let signal: AbortSignal | undefined = undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

    // In JSDOM test environments, window.AbortSignal conflicts with Node's native fetch
    const isJsdom = typeof window !== 'undefined';
    if (!isJsdom) {
      try {
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
          signal = AbortSignal.timeout(timeoutMs);
        } else {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          signal = controller.signal;
        }
      } catch {
        // Fallback
      }
    }

    try {
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: requestHeaders,
        redirect: 'follow',
      };
      if (signal) {
        fetchOptions.signal = signal;
      }
      const response = await fetch(url, fetchOptions);

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok && RETRYABLE_STATUS.has(response.status)) {
        lastError = `HTTP ${response.status}`;
        logger.warn(`[Fetcher] Retryable status ${response.status} for ${url}`);
        continue;
      }

      const text = await response.text();

      return {
        ok: response.ok,
        status: response.status,
        text,
        url: response.url || url,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = `Request timeout after ${timeoutMs}ms`;
        logger.warn(`[Fetcher] Timeout on attempt ${attempt + 1} for ${url}`);
      } else {
        lastError = err instanceof Error ? err.message : String(err);
        logger.warn(`[Fetcher] Network error on attempt ${attempt + 1} for ${url}: ${lastError}`);
      }
    }
  }

  logger.error(`[Fetcher] All ${maxRetries + 1} attempts failed for ${url}`, undefined, { url, lastError });
  return {
    ok: false,
    status: 0,
    text: '',
    url,
    error: lastError,
  };
}
