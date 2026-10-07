-- =============================================================================
-- AI Radar — Database Migration 001: Core Schema
-- =============================================================================
-- Run this migration against your Supabase project using the SQL editor
-- or the Supabase CLI: supabase db push
--
-- Tables created:
--   profiles, sources, categories, items, item_categories,
--   summaries, bookmarks, collection_runs
--
-- Prerequisites: Supabase project with auth.users available
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- Full-text search support (built-in to PostgreSQL, enabled by default)
-- pgcrypto for gen_random_uuid() — available in Supabase by default
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------

-- source_type: what kind of source this is
-- These are examples. The type is a text column with a CHECK so new types
-- can be added later without an ALTER TYPE statement (which requires locks).
-- We use CHECK constraints rather than ENUM to remain easily extensible.

-- item_type: what kind of information this item represents
-- Same approach: text with CHECK constraint.

-- collection status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_run_status') THEN
    CREATE TYPE collection_run_status AS ENUM ('running', 'completed', 'failed', 'partial');
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
-- Linked to auth.users via id.
-- One row per authenticated user.
-- AI Radar is personal-first; this schema scales to multi-user later.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url  TEXT,
  -- 'user' is the only role for now; 'admin' reserved for future use
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS
  'One row per authenticated Supabase user. Linked to auth.users.';
COMMENT ON COLUMN public.profiles.role IS
  'Account role. Currently only "user" is used. "admin" reserved for future multi-user administration.';

-- ---------------------------------------------------------------------------
-- Table: sources
-- ---------------------------------------------------------------------------
-- Represents an information source that AI Radar can collect from.
-- A source is configured by the operator (not per-user in Phase 2).

CREATE TABLE IF NOT EXISTS public.sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  source_type  TEXT NOT NULL CHECK (source_type IN (
                  'official_company', 'research', 'repository',
                  'community', 'news', 'regulatory', 'safety',
                  'database', 'other'
                )),
  base_url     TEXT NOT NULL,
  feed_url     TEXT,                  -- RSS/Atom feed URL if applicable
  description  TEXT,
  -- trust_level documents where information was sourced:
  --   1 = official primary source (company blog, official docs, standards body)
  --   2 = reputable secondary (major tech news outlet, academic repository)
  --   3 = community/aggregated (HN, Reddit, community forums)
  -- This is not an AI-assigned score. It is manually set when configuring a source.
  trust_level  SMALLINT NOT NULL DEFAULT 2 CHECK (trust_level BETWEEN 1 AND 3),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  -- Flexible JSONB for source-specific configuration (rate limits, auth hints, etc.)
  -- Never store real credentials here. Use environment variables for secrets.
  config       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sources_name_key ON public.sources (name);
CREATE INDEX IF NOT EXISTS sources_active_idx ON public.sources (active);
CREATE INDEX IF NOT EXISTS sources_source_type_idx ON public.sources (source_type);

COMMENT ON TABLE public.sources IS
  'Information sources that AI Radar collects from. Configured by the operator.';
COMMENT ON COLUMN public.sources.trust_level IS
  '1=official primary source, 2=reputable secondary, 3=community/aggregated. Manually set per source — not AI-assigned.';
COMMENT ON COLUMN public.sources.config IS
  'Source-specific configuration metadata (e.g. rate limits). Never store secrets here.';

-- ---------------------------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------------------------
-- Canonical category list that maps to the AI Radar navigation structure.
-- slug is the stable identifier used in code; label is the display name.
-- This separation allows the UI label to change without breaking data references.

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL,
  label      TEXT NOT NULL,
  description TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug);

COMMENT ON TABLE public.categories IS
  'Canonical category list. slug is the stable code identifier; label is the UI display name.';

-- ---------------------------------------------------------------------------
-- Table: items
-- ---------------------------------------------------------------------------
-- The most important table. Represents an original information record
-- discovered from a source.
--
-- IMPORTANT: This table stores SOURCE information only.
-- AI-generated analysis belongs in the summaries table.
-- These must never be mixed.

CREATE TABLE IF NOT EXISTS public.items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  -- external_id: the ID assigned by the source (e.g. arXiv paper ID, GitHub repo ID)
  -- nullable because not all sources provide a stable external identifier
  external_id   TEXT,
  canonical_url TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  -- content_text: short excerpt only. Do not store full copyrighted article text.
  content_text  TEXT,
  -- authors: stored as a JSONB array of strings for flexibility
  -- e.g. ["Jane Smith", "John Doe"] or ["@username"]
  authors       JSONB NOT NULL DEFAULT '[]',
  item_type     TEXT NOT NULL CHECK (item_type IN (
                  'announcement', 'research_paper', 'model_release', 'tool_release',
                  'repository', 'tutorial', 'company_update', 'funding',
                  'product_update', 'security_event', 'regulation',
                  'policy_update', 'career_signal', 'other'
                )),
  -- published_at: when the source says this was published (may be null if unknown)
  published_at  TIMESTAMPTZ,
  -- discovered_at: when AI Radar first found this record
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- content_hash: SHA-256 of (canonical_url + title + description) for deduplication
  -- Generated by the application before insert; not computed by the database
  content_hash  TEXT,
  -- metadata: flexible bag for source-specific fields that don't map to columns
  -- e.g. GitHub stars, arXiv categories, HN score
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplication indexes
-- A source + external_id combination must be unique when external_id is present
CREATE UNIQUE INDEX IF NOT EXISTS items_source_external_id_key
  ON public.items (source_id, external_id)
  WHERE external_id IS NOT NULL;

-- Canonical URL must be unique across all sources
CREATE UNIQUE INDEX IF NOT EXISTS items_canonical_url_key
  ON public.items (canonical_url);

-- Content hash index for fast duplicate detection
CREATE INDEX IF NOT EXISTS items_content_hash_idx
  ON public.items (content_hash)
  WHERE content_hash IS NOT NULL;

-- Query performance indexes
CREATE INDEX IF NOT EXISTS items_source_id_idx    ON public.items (source_id);
CREATE INDEX IF NOT EXISTS items_published_at_idx ON public.items (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS items_discovered_at_idx ON public.items (discovered_at DESC);
CREATE INDEX IF NOT EXISTS items_item_type_idx    ON public.items (item_type);
CREATE INDEX IF NOT EXISTS items_created_at_idx   ON public.items (created_at DESC);

-- Full-text search index over title + description
CREATE INDEX IF NOT EXISTS items_fts_idx
  ON public.items
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

COMMENT ON TABLE public.items IS
  'Original information records from sources. SOURCE DATA ONLY. AI analysis belongs in summaries.';
COMMENT ON COLUMN public.items.external_id IS
  'The identifier assigned by the source system (e.g. arXiv ID). Nullable — not all sources provide one.';
COMMENT ON COLUMN public.items.authors IS
  'JSONB array of author name strings. Example: ["Jane Smith"]. Not a foreign key — authors are not tracked separately in Phase 2.';
COMMENT ON COLUMN public.items.content_hash IS
  'SHA-256 of canonical_url+title+description. Computed by application before insert. Used for fast duplicate detection.';
COMMENT ON COLUMN public.items.metadata IS
  'Source-specific fields with no fixed schema (e.g. GitHub stars, arXiv categories). Read-only after insert.';

-- ---------------------------------------------------------------------------
-- Table: item_categories
-- ---------------------------------------------------------------------------
-- Many-to-many join between items and categories.
-- An item may belong to multiple categories.

CREATE TABLE IF NOT EXISTS public.item_categories (
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, category_id)
);

CREATE INDEX IF NOT EXISTS item_categories_category_id_idx
  ON public.item_categories (category_id);

COMMENT ON TABLE public.item_categories IS
  'Many-to-many join between items and categories. One item can belong to multiple categories.';

-- ---------------------------------------------------------------------------
-- Table: summaries
-- ---------------------------------------------------------------------------
-- AI-generated analysis of items.
-- MUST remain separate from the items table.
-- The original source record in items must never be overwritten by AI output.

CREATE TABLE IF NOT EXISTS public.summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  model_name   TEXT NOT NULL,          -- e.g. "gpt-4o", "claude-3-5-sonnet"
  provider     TEXT NOT NULL,          -- e.g. "openai", "anthropic", "google"
  -- summary: the AI-generated summary text
  summary      TEXT NOT NULL,
  -- key_points: structured JSONB array of key points extracted by the AI
  key_points   JSONB NOT NULL DEFAULT '[]',
  -- significance: why this item may matter (AI analysis)
  significance TEXT,
  -- claims: JSONB array of specific claims made in the source
  -- Each claim is {text, is_direct_quote, confidence}
  claims       JSONB NOT NULL DEFAULT '[]',
  -- confidence: 0.0–1.0. Set by the AI model. Documented, not magical.
  -- 0.0 = model expressed high uncertainty; 1.0 = model expressed high confidence
  -- This is the model's self-reported confidence, NOT a fact-checked accuracy score.
  confidence   NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each item should have at most one summary per model
  UNIQUE (item_id, model_name, provider)
);

CREATE INDEX IF NOT EXISTS summaries_item_id_idx ON public.summaries (item_id);

COMMENT ON TABLE public.summaries IS
  'AI-generated analysis. SEPARATE from source data in items. Never overwrites source records.';
COMMENT ON COLUMN public.summaries.confidence IS
  'Model self-reported confidence (0.0–1.0). This is NOT a fact-checked accuracy score.';
COMMENT ON COLUMN public.summaries.claims IS
  'JSONB array: [{text: string, is_direct_quote: boolean, confidence: number}]';

-- ---------------------------------------------------------------------------
-- Table: bookmarks
-- ---------------------------------------------------------------------------
-- User-saved items. User-specific and RLS-protected.

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A user cannot bookmark the same item twice
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx  ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS bookmarks_item_id_idx  ON public.bookmarks (item_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON public.bookmarks (created_at DESC);

COMMENT ON TABLE public.bookmarks IS
  'User-saved items. Protected by Row Level Security — users can only see their own bookmarks.';

-- ---------------------------------------------------------------------------
-- Table: collection_runs
-- ---------------------------------------------------------------------------
-- Tracks each source collection job. Phase 3 collectors will write to this table.
-- Created in Phase 2 so the foundation is stable before collectors are built.

CREATE TABLE IF NOT EXISTS public.collection_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  status           collection_run_status NOT NULL DEFAULT 'running',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  items_discovered INTEGER NOT NULL DEFAULT 0,
  items_created    INTEGER NOT NULL DEFAULT 0,
  items_updated    INTEGER NOT NULL DEFAULT 0,
  -- errors: JSONB array of {message, timestamp, context} objects
  -- Safe error details only — never store API keys, passwords, or raw stack traces
  errors           JSONB NOT NULL DEFAULT '[]',
  -- metadata: collector-specific run details (e.g. pages fetched, rate limit hits)
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collection_runs_source_id_idx  ON public.collection_runs (source_id);
CREATE INDEX IF NOT EXISTS collection_runs_status_idx     ON public.collection_runs (status);
CREATE INDEX IF NOT EXISTS collection_runs_started_at_idx ON public.collection_runs (started_at DESC);

COMMENT ON TABLE public.collection_runs IS
  'Records of source collection jobs. Phase 3 collectors write here. errors stores safe details only — never credentials.';

-- ---------------------------------------------------------------------------
-- Trigger: updated_at auto-update
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'sources', 'items', 'summaries'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'set_updated_at_' || t
        AND tgrelid = ('public.' || t)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END$$;

-- ---------------------------------------------------------------------------
-- Seed: default categories
-- ---------------------------------------------------------------------------
-- These match the AI Radar navigation structure from Phase 1.
-- slugs are the stable identifiers used in application code.

INSERT INTO public.categories (slug, label, description, sort_order) VALUES
  ('ai-news',          'AI News',              'Official announcements, product releases, and industry developments', 1),
  ('ai-tools',         'AI Tools',             'New and notable AI-powered tools and applications',                  2),
  ('models',           'Models & Research',    'Foundation models, benchmarks, and academic research papers',        3),
  ('coding-agents',    'Coding Agents',        'AI coding assistants, agent frameworks, and developer automation',   4),
  ('emerging-trends',  'Emerging Trends',      'Recurring signals detected across multiple independent sources',      5),
  ('career',           'Career & Projects',    'Skills, learning paths, and project ideas from real developments',   6),
  ('business',         'Business',             'Customer problems and AI-enabled solutions based on evidence',       7),
  ('safety-regulation','Safety & Regulation',  'AI safety research, policy, and regulatory developments',           8)
ON CONFLICT (slug) DO NOTHING;
