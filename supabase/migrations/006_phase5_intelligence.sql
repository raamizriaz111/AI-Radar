-- =============================================================================
-- AI Radar — Migration 006: Phase 5 Intelligence, Trends & Briefings
-- =============================================================================
-- Establishes persistent data architecture for:
--   1. Emerging trends with lifecycle and confidence
--   2. Trend evidence linking trends to specific source items
--   3. Daily intelligence briefings with traceable citations
--   4. Explicit user preferences for personalized relevance
--
-- Safe, idempotent, and non-destructive.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: trends
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trends (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  description           TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN (
                          'early_signal', 'developing', 'established',
                          'uncertain', 'declining', 'inactive'
                        )) DEFAULT 'early_signal',
  confidence            TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')) DEFAULT 'medium',
  confidence_score      NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1) DEFAULT 0.50,
  summary               TEXT,
  why_it_matters        TEXT,
  what_to_watch         TEXT,
  timeline              JSONB NOT NULL DEFAULT '[]'::jsonb,
  technologies          JSONB NOT NULL DEFAULT '[]'::jsonb,
  entities              JSONB NOT NULL DEFAULT '[]'::jsonb,
  topics                JSONB NOT NULL DEFAULT '[]'::jsonb,
  distinct_source_count INTEGER NOT NULL DEFAULT 1,
  item_count            INTEGER NOT NULL DEFAULT 1,
  activity_change_pct   NUMERIC(6,2) DEFAULT 0.0,
  first_detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trends_slug_idx ON public.trends (slug);
CREATE INDEX IF NOT EXISTS trends_status_idx ON public.trends (status);
CREATE INDEX IF NOT EXISTS trends_confidence_idx ON public.trends (confidence);
CREATE INDEX IF NOT EXISTS trends_last_updated_at_idx ON public.trends (last_updated_at DESC);

COMMENT ON TABLE public.trends IS
  'Emerging AI trends supported by multi-source evidence. Distinct from individual signals.';

-- -----------------------------------------------------------------------------
-- 2. Table: trend_evidence
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trend_evidence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id          UUID NOT NULL REFERENCES public.trends(id) ON DELETE CASCADE,
  item_id           UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
                      'supporting', 'related', 'contradictory', 'background'
                    )) DEFAULT 'supporting',
  evidence_strength TEXT NOT NULL CHECK (evidence_strength IN ('strong', 'moderate', 'weak')) DEFAULT 'moderate',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trend_id, item_id)
);

CREATE INDEX IF NOT EXISTS trend_evidence_trend_id_idx ON public.trend_evidence (trend_id);
CREATE INDEX IF NOT EXISTS trend_evidence_item_id_idx ON public.trend_evidence (item_id);

COMMENT ON TABLE public.trend_evidence IS
  'M:N join linking trends to specific evidence items, with relationship type and strength.';

-- -----------------------------------------------------------------------------
-- 3. Table: daily_briefings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_briefings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date   DATE NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT NOT NULL,
  sections        JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_signals     JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count      INTEGER NOT NULL DEFAULT 0,
  model_name      TEXT NOT NULL,
  provider        TEXT NOT NULL,
  prompt_version  TEXT NOT NULL DEFAULT '1.0.0',
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_briefings_date_idx ON public.daily_briefings (briefing_date DESC);

COMMENT ON TABLE public.daily_briefings IS
  'Generated daily intelligence briefings with traceable item citations.';

-- -----------------------------------------------------------------------------
-- 4. Table: user_preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE,
  topics         JSONB NOT NULL DEFAULT '["LLMs", "AI Agents", "Models & Research", "Inference & Serving", "Safety & Regulation"]'::jsonb,
  categories     JSONB NOT NULL DEFAULT '["models", "coding-agents", "ai-tools", "ai-news"]'::jsonb,
  interest_level JSONB NOT NULL DEFAULT '{"coding-agents": "high", "models": "high", "ai-tools": "medium"}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_preferences IS
  'Explicit user topic and category preferences for personal relevance scoring.';

-- -----------------------------------------------------------------------------
-- 5. Row Level Security Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trends_select_all" ON public.trends;
CREATE POLICY "trends_select_all" ON public.trends FOR SELECT USING (true);

DROP POLICY IF EXISTS "trend_evidence_select_all" ON public.trend_evidence;
CREATE POLICY "trend_evidence_select_all" ON public.trend_evidence FOR SELECT USING (true);

DROP POLICY IF EXISTS "daily_briefings_select_all" ON public.daily_briefings;
CREATE POLICY "daily_briefings_select_all" ON public.daily_briefings FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_preferences_select_all" ON public.user_preferences;
CREATE POLICY "user_preferences_select_all" ON public.user_preferences FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_preferences_modify_all" ON public.user_preferences;
CREATE POLICY "user_preferences_modify_all" ON public.user_preferences FOR ALL USING (true);
