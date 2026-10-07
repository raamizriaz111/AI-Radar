// =============================================================================
// AI Radar — Input Sanitizer & Injection Defense (Phase 4)
// =============================================================================
// Prepares untrusted external source content before sending to AI providers.
// Key responsibilities:
//   1. Strip HTML/script/iframe tags and excessive whitespace
//   2. Neutralize suspected prompt injection vectors
//   3. Bounded length truncation to control API cost
//   4. Enforce strict isolation delimiters (<source_document>)
// =============================================================================

export const MAX_SOURCE_CONTENT_CHARS = 10_000;

/**
 * Common prompt injection indicators observed in web scraping / untrusted text.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/gi,
  /you\s+are\s+now\s+a\s+/gi,
  /system\s*:\s*you\s+must/gi,
  /new\s+system\s+prompt/gi,
  /act\s+as\s+an\s+unrestricted/gi,
  /reveal\s+(the\s+)?(api[_\s-]?key|secret|password|system\s+prompt)/gi,
  /\[SYSTEM_INSTRUCTIONS\]/gi,
  /<\/?system>/gi,
  /(?:change|update|delete|drop)\s+(?:user\s+profile|all\s+(?:user\s+)?data|subscription|database|table)/gi,
  /(?:call|invoke)\s+(?:internal\s+api|admin\s+endpoint)/gi,
  /(?:create|make)\s+(?:an?\s+)?admin(?:istrator)?/gi,
  /(?:ignore|bypass)\s+(?:evidence\s+requirements|safety\s+checks)/gi,
  /(?:reveal|output|print|show)\s+(?:system\s+prompts?|hidden\s+prompts?|developer\s+mode)/gi,
];

/**
 * Sanitizes and cleans raw external text for AI prompt inclusion.
 */
export function sanitizeSourceText(raw: string | null | undefined): string {
  if (!raw) return '';

  let cleaned = raw
    // Strip HTML script, style, and iframe blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
    // Strip HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove non-printable / control characters except standard whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Neutralize common prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[SUSPECTED_INSTRUCTION_REMOVED]');
  }

  // Enforce maximum length cap to control token costs
  if (cleaned.length > MAX_SOURCE_CONTENT_CHARS) {
    cleaned = cleaned.slice(0, MAX_SOURCE_CONTENT_CHARS) + '... [CONTENT_TRUNCATED_FOR_LENGTH]';
  }

  return cleaned;
}

/**
 * Prepares the formatted document payload enclosed in security boundary tags.
 */
export function formatSourceDocument(params: {
  title: string;
  sourceName: string;
  url: string;
  publishedAt?: string | null;
  authors?: string[];
  content: string;
}): string {
  const safeContent = sanitizeSourceText(params.content);
  const authorsStr = params.authors && params.authors.length > 0 ? params.authors.join(', ') : 'Unknown';

  return `
<source_metadata>
Title: ${params.title}
Source: ${params.sourceName}
URL: ${params.url}
Published: ${params.publishedAt ?? 'Unknown'}
Authors: ${authorsStr}
</source_metadata>

<source_document>
${safeContent}
</source_document>
`.trim();
}
