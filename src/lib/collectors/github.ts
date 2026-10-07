// =============================================================================
// AI Radar — GitHub AI Repositories Collector (Phase 3)
// =============================================================================
// Collects trending/notable AI-related repositories from GitHub.
//
// Source: GitHub REST API v3
// Endpoint: /search/repositories (public endpoint)
// Access: Public, unauthenticated — 10 requests/min rate limit.
//   With a GITHUB_TOKEN env variable: 30 requests/min.
//   We make at most 3 API calls per run (well within limits).
// Attribution: GitHub — links to original repositories.
// Terms: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
//
// Search queries: We search for AI-related repos created/pushed recently with
// significant star counts. This is a public API intended for this kind of use.
//
// SECURITY: Parsed content is treated as untrusted data.
//   Repository descriptions and README content are NOT collected or stored.
//   We only store: name, description (short field), URL, star count, topics.
// =============================================================================

import { BaseCollector } from './base';
import { fetchWithRetry } from './fetcher';
import { normalizeUrl, normalizeTitle, normalizeDescription, parseDate } from './normalizer';
import { classifyItem } from './classifier';
import type { CollectorConfig, NormalizedItem } from './types';
import { logger } from '@/lib/services/logger';

const GITHUB_API_BASE = 'https://api.github.com';

// AI-related search queries — focused, not exhaustive
const AI_SEARCH_QUERIES = [
  'topic:llm pushed:>2024-01-01 stars:>50',
  'topic:large-language-model pushed:>2024-01-01 stars:>50',
  'topic:ai-agent pushed:>2024-01-01 stars:>100',
];

const REPOS_PER_QUERY = 15;

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  pushed_at: string | null;
  created_at: string | null;
  license: { spdx_id: string } | null;
  owner: { login: string };
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

function buildSearchUrl(query: string, perPage: number): string {
  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: String(perPage),
  });
  return `${GITHUB_API_BASE}/search/repositories?${params}`;
}

export class GitHubCollector extends BaseCollector {
  readonly slug = 'github-ai-repos';
  readonly displayName = 'GitHub AI Repositories';

  protected async fetchItems(config: CollectorConfig): Promise<NormalizedItem[]> {
    const maxTotal = config.maxItems ?? 40;
    const perQuery = Math.ceil(maxTotal / AI_SEARCH_QUERIES.length);
    const items: NormalizedItem[] = [];
    const seenIds = new Set<string>();

    // Build auth headers if token is available
    const githubToken = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    for (const query of AI_SEARCH_QUERIES) {
      const url = buildSearchUrl(query, Math.min(perQuery, REPOS_PER_QUERY));
      logger.info(`[GitHub] Fetching repos: ${query}`);

      const result = await fetchWithRetry(url, {
        timeoutMs: config.timeoutMs ?? 15_000,
        maxRetries: config.maxRetries ?? 1,
        headers,
      });

      if (!result.ok) {
        logger.warn(`[GitHub] Failed to fetch query "${query}"`, { status: result.status, error: result.error });
        continue;
      }

      // Rate limit: GitHub search has 10 req/min unauthenticated → add delay
      await new Promise((r) => setTimeout(r, githubToken ? 2_500 : 7_000));

      let parsed: GitHubSearchResponse;
      try {
        parsed = JSON.parse(result.text) as GitHubSearchResponse;
      } catch {
        logger.warn(`[GitHub] Failed to parse JSON for query "${query}"`);
        continue;
      }

      const repos = parsed.items ?? [];
      logger.info(`[GitHub] Parsed ${repos.length} repos for query: ${query}`);

      for (const repo of repos) {
        const repoId = String(repo.id);
        if (seenIds.has(repoId)) continue;
        seenIds.add(repoId);

        if (!repo.full_name || !repo.html_url) continue;

        const canonicalUrl = normalizeUrl(repo.html_url);
        const title = normalizeTitle(repo.full_name);
        const description = repo.description
          ? normalizeDescription(repo.description, 500)
          : null;

        const publishedAt = parseDate(repo.pushed_at ?? repo.created_at);

        // Build combined text for classification
        const combinedText = `${title} ${description ?? ''} ${repo.topics.join(' ')}`;
        const classification = classifyItem('github', combinedText, description, repo.topics);

        // Ensure coding-agents category for agent-topic repos
        if (
          repo.topics.some((t) => t.includes('agent') || t.includes('copilot') || t.includes('coding'))
          && !classification.categorySlugs.includes('coding-agents')
        ) {
          classification.categorySlugs.push('coding-agents');
        }

        items.push({
          canonicalUrl,
          externalId: repoId,
          title,
          description,
          authors: [repo.owner.login],
          publishedAt,
          itemType: classification.itemType,
          categorySlugs: classification.categorySlugs,
          metadata: {
            fullName: repo.full_name,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            topics: repo.topics,
            license: repo.license?.spdx_id ?? null,
            searchQuery: query,
          },
        });
      }
    }

    logger.info(`[GitHub] Total unique repos collected: ${items.length}`);
    return items;
  }
}

export const githubCollector = new GitHubCollector();
