// =============================================================================
// AI Radar — Hugging Face Papers Collector (Phase 3)
// =============================================================================
// Collects recent AI papers featured on Hugging Face Papers.
//
// Source: https://huggingface.co/papers
// Feed: https://huggingface.co/papers.rss (public RSS feed — no API key required)
// Access: Public, free.
// Rate limits: Standard web crawl limits — we fetch once per run.
// Attribution: Hugging Face — papers link to arXiv originals.
//
// SECURITY: Parsed content is treated as untrusted data.
// =============================================================================

import { BaseCollector } from './base';
import { fetchWithRetry } from './fetcher';
import { parseFeed } from './xmlParser';
import { normalizeUrl, normalizeTitle, normalizeDescription, parseDate, normalizeAuthors } from './normalizer';
import { classifyItem } from './classifier';
import type { CollectorConfig, NormalizedItem } from './types';
import { logger } from '@/lib/services/logger';

const HF_PAPERS_RSS = 'https://huggingface.co/papers.rss';

/**
 * Extract an arXiv ID from a Hugging Face paper URL or description.
 * HF papers link to arXiv as canonical sources.
 */
function extractArxivIdFromText(text: string): string | null {
  const match = text.match(/arxiv\.org\/abs\/([\w.]+?)(?:v\d+)?(?:[^\w.]|$)/i)
    ?? text.match(/\b(\d{4}\.\d{4,5})(?:v\d+)?\b/);
  return match ? match[1] : null;
}

export class HuggingFacePapersCollector extends BaseCollector {
  readonly slug = 'huggingface-papers';
  readonly displayName = 'Hugging Face Papers';

  protected async fetchItems(config: CollectorConfig): Promise<NormalizedItem[]> {
    const maxItems = config.maxItems ?? 30;
    logger.info(`[HuggingFace Papers] Fetching RSS feed`, { url: HF_PAPERS_RSS });

    const result = await fetchWithRetry(HF_PAPERS_RSS, {
      timeoutMs: config.timeoutMs ?? 15_000,
      maxRetries: config.maxRetries ?? 2,
    });

    if (!result.ok || !result.text) {
      logger.warn(`[HuggingFace Papers] Failed to fetch RSS`, { error: result.error });
      return [];
    }

    const entries = parseFeed(result.text);
    logger.info(`[HuggingFace Papers] Parsed ${entries.length} entries`);

    const items: NormalizedItem[] = [];
    const seenUrls = new Set<string>();

    for (const entry of entries.slice(0, maxItems)) {
      if (!entry.title || !entry.link) continue;

      // Prefer arXiv canonical URL when available (HF papers are primarily arXiv papers)
      const arxivId = extractArxivIdFromText(entry.link)
        ?? extractArxivIdFromText(entry.summary ?? '');

      let canonicalUrl: string;
      let externalId: string | null = null;

      if (arxivId) {
        canonicalUrl = normalizeUrl(`https://arxiv.org/abs/${arxivId}`);
        externalId = arxivId;
      } else {
        canonicalUrl = normalizeUrl(entry.link);
      }

      if (seenUrls.has(canonicalUrl)) continue;
      seenUrls.add(canonicalUrl);

      const title = normalizeTitle(entry.title);
      const description = normalizeDescription(entry.summary ?? '', 1500);
      const publishedAt = parseDate(entry.published);
      const authors = normalizeAuthors(entry.authors);

      const classification = classifyItem('huggingface', title, description, entry.categories);

      items.push({
        canonicalUrl,
        externalId,
        title,
        description,
        authors,
        publishedAt,
        itemType: classification.itemType,
        categorySlugs: classification.categorySlugs,
        metadata: {
          hfLink: entry.link,
          arxivId,
          sourceCategories: entry.categories,
        },
      });
    }

    logger.info(`[HuggingFace Papers] Returning ${items.length} items`);
    return items;
  }
}

export const huggingFacePapersCollector = new HuggingFacePapersCollector();
