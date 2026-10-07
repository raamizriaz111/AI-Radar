-- =============================================================================
-- AI Radar — Migration 004: Phase 3 Source Seeds
-- =============================================================================
-- Seeds the three initial Phase 3 data sources into the `sources` table.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING via unique name).
--
-- Sources seeded here:
--   1. arXiv AI/ML  — public Atom feed, no key required
--   2. Hugging Face Papers — public RSS feed, no key required
--   3. GitHub AI Repositories — public search API (unauthenticated)
--
-- These slugs must match the collector slugs in:
--   src/lib/collectors/registry.ts
-- =============================================================================

-- arXiv
INSERT INTO public.sources (
  name,
  source_type,
  base_url,
  feed_url,
  description,
  trust_level,
  active,
  config
)
VALUES (
  'arXiv AI/ML',
  'research',
  'https://arxiv.org',
  'https://export.arxiv.org/api/query',
  'arXiv preprint server — AI and Machine Learning research papers (cs.AI, cs.LG, cs.CL, cs.CV, cs.RO, stat.ML). Public Atom feed. No API key required.',
  1,
  true,
  '{
    "slug": "arxiv",
    "subjects": ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.RO", "stat.ML"],
    "items_per_subject": 10,
    "delay_between_requests_ms": 3100,
    "terms_url": "https://arxiv.org/help/api/tou"
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Hugging Face Papers
INSERT INTO public.sources (
  name,
  source_type,
  base_url,
  feed_url,
  description,
  trust_level,
  active,
  config
)
VALUES (
  'Hugging Face Papers',
  'database',
  'https://huggingface.co/papers',
  'https://huggingface.co/papers.rss',
  'Hugging Face curated AI research papers feed. Public RSS feed. No API key required. Papers primarily link to arXiv originals.',
  1,
  true,
  '{
    "slug": "huggingface-papers",
    "max_items": 30,
    "terms_url": "https://huggingface.co/terms-of-service"
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- GitHub AI Repositories
INSERT INTO public.sources (
  name,
  source_type,
  base_url,
  feed_url,
  description,
  trust_level,
  active,
  config
)
VALUES (
  'GitHub AI Repositories',
  'repository',
  'https://github.com',
  NULL,
  'GitHub repository search API — trending and notable AI-related repositories. Public API. No API key required (rate-limited). Optional GITHUB_TOKEN env variable increases rate limits.',
  2,
  true,
  '{
    "slug": "github-ai-repos",
    "max_items": 40,
    "search_topics": ["llm", "large-language-model", "ai-agent"],
    "min_stars": 50,
    "api_version": "2022-11-28",
    "terms_url": "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;
