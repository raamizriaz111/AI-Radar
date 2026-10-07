// =============================================================================
// AI Radar — World AI News Collector
// =============================================================================
// Collects real-time, mainstream AI news from top verified news sources:
//   1. Google News AI RSS (aggregates BBC, CBS, Reuters, NYT, Bloomberg, etc.)
//   2. TechCrunch AI (industry announcements, products, startup launches)
//
// Designed to bring real, fresh, understandable news about what is happening
// in the world with artificial intelligence.
// =============================================================================

import { BaseCollector } from './base';
import { fetchWithRetry } from './fetcher';
import { parseFeed, type FeedEntry } from './xmlParser';
import { normalizeUrl, normalizeTitle, normalizeDescription, parseDate } from './normalizer';
import { classifyItem } from './classifier';
import type { CollectorConfig, NormalizedItem } from './types';
import { logger } from '@/lib/services/logger';

const FEEDS = [
  {
    name: 'Google News AI',
    url: 'https://news.google.com/rss/search?q=Artificial+Intelligence&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
  },
  {
    name: 'Ars Technica AI',
    url: 'https://arstechnica.com/tag/ai/feed/',
  },
  {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
  },
];

/**
 * Decode HTML entities like &#8217;, &amp;, &quot;, &#39;, &nbsp;
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, '—')
    .replace(/&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '') // remove any stray HTML tags
    .trim();
}

/**
 * Extract publication/source from title if formatted like:
 * "Article Title - Source Name"
 */
function extractSourceFromTitle(title: string): { cleanTitle: string; publisher?: string } {
  const match = title.match(/^(.*?)\s*[-–—]\s*([^-–—]+)$/);
  if (match && match[2].trim().length < 40) {
    return {
      cleanTitle: decodeHtmlEntities(match[1].trim()),
      publisher: decodeHtmlEntities(match[2].trim()),
    };
  }
  return { cleanTitle: decodeHtmlEntities(title) };
}

export class WorldNewsCollector extends BaseCollector {
  readonly slug = 'world-ai-news';
  readonly displayName = 'World AI News';

  protected async fetchItems(config: CollectorConfig): Promise<NormalizedItem[]> {
    const maxItems = config.maxItems ?? 50;
    const itemsPerFeed = Math.ceil(maxItems / FEEDS.length);
    const items: NormalizedItem[] = [];
    const seenUrls = new Set<string>();

    for (const feed of FEEDS) {
      try {
        logger.info(`[World AI News] Fetching feed: ${feed.name}`, { url: feed.url });

        const result = await fetchWithRetry(feed.url, {
          timeoutMs: config.timeoutMs ?? 15_000,
          maxRetries: config.maxRetries ?? 2,
        });

        if (!result.ok || !result.text) {
          logger.warn(`[World AI News] Failed to fetch feed ${feed.name}`, { error: result.error });
          continue;
        }

        const entries: FeedEntry[] = parseFeed(result.text);
        logger.info(`[World AI News] Parsed ${entries.length} entries from ${feed.name}`);

        for (const entry of entries.slice(0, itemsPerFeed)) {
          if (!entry.title || !entry.link) continue;

          const rawTitle = decodeHtmlEntities(entry.title);
          // Skip feed header items like "Google News" or "TechCrunch"
          if (rawTitle === 'Google News' || rawTitle.startsWith('AI News &')) continue;

          const { cleanTitle, publisher } = extractSourceFromTitle(rawTitle);
          if (!cleanTitle) continue;

          const canonicalUrl = normalizeUrl(entry.link);
          if (seenUrls.has(canonicalUrl)) continue;
          seenUrls.add(canonicalUrl);

          const rawDesc = decodeHtmlEntities(entry.summary || '');
          const description = normalizeDescription(rawDesc, 1500);
          const publishedAt = parseDate(entry.published);

          const author = publisher || entry.authors?.[0] || feed.name;
          const authors = [author];

          // Use deterministic classifier with fallback to 'news'
          const classification = classifyItem('other', cleanTitle, description, entry.categories);

          items.push({
            canonicalUrl,
            externalId: entry.id || canonicalUrl,
            title: cleanTitle,
            description: description || `Recent AI development reported by ${author}.`,
            authors,
            publishedAt,
            itemType: classification.itemType === 'other' ? 'announcement' : classification.itemType,
            categorySlugs: classification.categorySlugs.length > 0 ? classification.categorySlugs : ['ai-news'],
            metadata: {
              publisher: author,
              feedSource: feed.name,
              originalCategories: entry.categories,
            },
          });
        }
      } catch (err) {
        logger.error(`[World AI News] Error processing feed ${feed.name}`, err instanceof Error ? err : undefined);
      }
    }

    logger.info(`[World AI News] Returning total of ${items.length} items`);
    return items;
  }
}

export const worldNewsCollector = new WorldNewsCollector();
