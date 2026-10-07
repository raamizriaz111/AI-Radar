// =============================================================================
// AI Radar — arXiv Collector (Phase 3)
// =============================================================================
// Collects recent AI/ML research papers from the arXiv Atom export API.
//
// Source: https://export.arxiv.org/api/
// Access: Public, free, no API key required.
// Rate limits: Maximum 1 request per 3 seconds per arXiv ToS.
//   We fetch in a single burst of ≤ 100 items per run — well within limits.
// Attribution: arXiv.org — papers are open access under respective licences.
//
// Collected subjects (CS.AI, CS.LG, CS.CL, CS.CV, STAT.ML):
//   cs.AI  — Artificial Intelligence
//   cs.LG  — Machine Learning
//   cs.CL  — Computation and Language (NLP)
//   cs.CV  — Computer Vision
//   cs.RO  — Robotics
//   cs.SE  — Software Engineering (agent-adjacent)
//   stat.ML — Machine Learning (statistics)
//
// SECURITY: Parsed content is treated as untrusted data.
// We store metadata and abstracts only — never execute parsed content.
// =============================================================================

import { BaseCollector } from './base';
import { fetchWithRetry } from './fetcher';
import { parseFeed } from './xmlParser';
import { normalizeUrl, normalizeTitle, normalizeDescription, parseDate, normalizeAuthors } from './normalizer';
import { classifyItem } from './classifier';
import type { CollectorConfig, NormalizedItem } from './types';
import { logger } from '@/lib/services/logger';

const ARXIV_SUBJECTS = ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV', 'cs.RO', 'stat.ML'];
const ITEMS_PER_SUBJECT = 10; // fetch last 10 per subject per run

/**
 * Build an arXiv API query URL for a given subject category.
 * Searches for recent submissions sorted by submission date.
 *
 * Docs: https://arxiv.org/help/api/user-manual
 */
function buildArxivUrl(subject: string, maxResults: number): string {
  const params = new URLSearchParams({
    search_query: `cat:${subject}`,
    start: '0',
    max_results: String(maxResults),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  });
  return `https://export.arxiv.org/api/query?${params.toString()}`;
}

/**
 * Extract the arXiv paper ID from an arXiv entry ID URL.
 * e.g. "http://arxiv.org/abs/2301.00001v1" → "2301.00001"
 */
function extractArxivId(idUrl: string): string | null {
  const match = idUrl.match(/arxiv\.org\/abs\/([\w.]+?)(?:v\d+)?$/i);
  return match ? match[1] : null;
}

export class ArxivCollector extends BaseCollector {
  readonly slug = 'arxiv';
  readonly displayName = 'arXiv';

  protected async fetchItems(config: CollectorConfig): Promise<NormalizedItem[]> {
    const maxTotal = config.maxItems ?? 60;
    const perSubject = Math.max(1, Math.floor(maxTotal / ARXIV_SUBJECTS.length));
    const items: NormalizedItem[] = [];
    const seenIds = new Set<string>();

    for (const subject of ARXIV_SUBJECTS) {
      const url = buildArxivUrl(subject, Math.min(perSubject, ITEMS_PER_SUBJECT));
      logger.info(`[arXiv] Fetching subject ${subject}`, { url });

      const result = await fetchWithRetry(url, {
        timeoutMs: config.timeoutMs ?? 20_000,
        maxRetries: config.maxRetries ?? 2,
      });

      if (!result.ok || !result.text) {
        logger.warn(`[arXiv] Failed to fetch ${subject}`, { error: result.error });
        continue;
      }

      // Add a small delay between subject requests to respect arXiv rate limits
      await new Promise((r) => setTimeout(r, 3_100));

      const entries = parseFeed(result.text);
      logger.info(`[arXiv] Parsed ${entries.length} entries for ${subject}`);

      for (const entry of entries) {
        // Extract arXiv paper ID for deduplication
        const arxivId = extractArxivId(entry.id);
        if (!arxivId || seenIds.has(arxivId)) continue;
        seenIds.add(arxivId);

        if (!entry.title || !entry.link) continue;

        // Build canonical URL: always use abs/ format without version suffix
        const canonicalUrl = normalizeUrl(`https://arxiv.org/abs/${arxivId}`);
        const title = normalizeTitle(entry.title);
        const description = normalizeDescription(entry.summary ?? '', 1500);
        const publishedAt = parseDate(entry.published);
        const authors = normalizeAuthors(entry.authors);

        // Classify using source type + content
        const classification = classifyItem(
          'arxiv',
          title,
          description,
          entry.categories
        );

        // Always include the source subject as an extra category signal
        if (subject === 'cs.AI' || subject === 'cs.LG' || subject === 'stat.ML') {
          if (!classification.categorySlugs.includes('models')) {
            classification.categorySlugs.push('models');
          }
        }

        items.push({
          canonicalUrl,
          externalId: arxivId,
          title,
          description,
          authors,
          publishedAt,
          itemType: classification.itemType,
          categorySlugs: classification.categorySlugs,
          metadata: {
            arxivId,
            subject,
            sourceCategories: entry.categories,
            arxivLink: entry.link,
          },
        });
      }
    }

    logger.info(`[arXiv] Total unique items collected: ${items.length}`);
    return items;
  }
}

export const arxivCollector = new ArxivCollector();
