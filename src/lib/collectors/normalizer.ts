// =============================================================================
// AI Radar — Normalizer (Phase 3)
// =============================================================================
// Utilities for cleaning and normalising raw values from external sources.
// All inputs are treated as untrusted external content.
// Normalisation is purely mechanical — no AI processing.
// =============================================================================

/**
 * Normalise a canonical URL:
 * - Trim whitespace
 * - Force lowercase scheme + host
 * - Remove trailing slash on root paths
 * - Strip common tracking parameters (utm_*)
 */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    // Strip tracking params
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith('utm_') || key === 'ref' || key === 'src' || key === 'fbclid') {
        u.searchParams.delete(key);
      }
    }
    // Lowercase scheme + host
    let result = `${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${u.port ? `:${u.port}` : ''}${u.pathname}`;
    if (u.search) result += u.search;
    if (u.hash) result += u.hash;
    // Remove trailing slash only if it is the root path
    if (result.endsWith('/') && u.pathname === '/') {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return raw.trim();
  }
}

/**
 * Normalise a title: collapse whitespace, trim, limit length.
 */
export function normalizeTitle(raw: string, maxLength = 500): string {
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '') // zero-width chars
    .trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength - 3) + '...' : cleaned;
}

/**
 * Normalise a description / abstract: collapse whitespace, trim HTML tags, limit length.
 */
export function normalizeDescription(raw: string, maxLength = 2000): string {
  const stripped = raw
    .replace(/<[^>]+>/g, ' ')   // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > maxLength ? stripped.slice(0, maxLength - 3) + '...' : stripped;
}

/**
 * Parse a date string into an ISO 8601 datetime string.
 * Returns null if unparseable.
 */
export function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw.trim());
    if (isNaN(d.getTime())) return null;
    // Reject obviously wrong dates (before 2015 or more than 2 days in the future)
    const year = d.getFullYear();
    if (year < 2015) return null;
    const now = Date.now();
    if (d.getTime() > now + 2 * 24 * 60 * 60 * 1000) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Normalise an author name: trim, limit length.
 * Returns empty string for obviously bot/automated names.
 */
export function normalizeAuthorName(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (cleaned.length > 200) return cleaned.slice(0, 197) + '...';
  return cleaned;
}

/**
 * Normalise an array of author names, deduplicating and filtering blanks.
 */
export function normalizeAuthors(raw: string[]): string[] {
  return [...new Set(raw.map(normalizeAuthorName).filter((a) => a.length > 0))];
}
