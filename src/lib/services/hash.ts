// =============================================================================
// AI Radar — Content Hash Utility
// =============================================================================
// Computes deterministic SHA-256 hashes of item content for deduplication.
// Works consistently across Node.js runtime and edge.
// =============================================================================

import { createHash } from 'crypto';

/**
 * Normalizes input text by trimming, converting to lower case, and collapsing whitespace.
 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Computes a SHA-256 hash of canonical URL, normalized title, and normalized description.
 * Used by item repository for fast duplicate detection across sources.
 */
export function computeContentHash(params: {
  canonicalUrl: string;
  title: string;
  description?: string | null;
}): string {
  const normalizedUrl = params.canonicalUrl.trim().toLowerCase();
  const normalizedTitle = normalizeText(params.title);
  const normalizedDesc = params.description ? normalizeText(params.description) : '';

  const payload = `${normalizedUrl}|${normalizedTitle}|${normalizedDesc}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
