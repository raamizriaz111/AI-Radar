-- =============================================================================
-- AI Radar — Complete Missing Tables Migration (Idempotent)
-- =============================================================================
-- Copy and paste this script directly into the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iuputrnjwuvoaxykbioa/sql/new
--
-- Safely creates all missing Phase 5–8 tables with RLS and indexes:
--   1. trends & trend_evidence
--   2. daily_briefings
--   3. user_preferences
--   4. user_plans & ai_usage_logs
--   5. user_tracked_topics & user_saved_intelligence
--   6. product_analytics_events
-- =============================================================================

-- 1. Table: trends
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
  last_updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trends_slug_idx ON public.trends (slug);
CREATE INDEX IF NOT EXISTS trends_status_idx ON public.trends (status);
CREATE INDEX IF NOT EXISTS trends_confidence_idx ON public.trends (confidence);
CREATE INDEX IF NOT EXISTS trends_last_updated_at_idx ON public.trends (last_updated_at DESC);

-- 2. Table: trend_evidence
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

-- 3. Table: daily_briefings
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

-- 4. Table: user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE,
  topics         JSONB NOT NULL DEFAULT '["LLMs", "AI Agents", "Models & Research", "Inference & Serving", "Safety & Regulation"]'::jsonb,
  categories     JSONB NOT NULL DEFAULT '["models", "coding-agents", "ai-tools", "ai-news"]'::jsonb,
  interest_level JSONB NOT NULL DEFAULT '{"coding-agents": "high", "models": "high", "ai-tools": "medium"}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: user_plans
CREATE TABLE IF NOT EXISTS public.user_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE NOT NULL,
  plan_tier            TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'team', 'enterprise')),
  ai_requests_limit    INT NOT NULL DEFAULT 100,
  briefings_limit      INT NOT NULL DEFAULT 10,
  tracked_topics_limit INT NOT NULL DEFAULT 20,
  features             JSONB NOT NULL DEFAULT '{"custom_topics": true, "export": false, "early_trends": true}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_plans_user_idx ON public.user_plans (user_id);

-- 6. Table: ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID,
  operation_type    TEXT NOT NULL CHECK (operation_type IN ('summary', 'enrichment', 'trend_detection', 'briefing', 'personal_relevance', 'project_generation', 'skill_analysis', 'search')),
  provider          TEXT NOT NULL,
  model             TEXT NOT NULL,
  prompt_version    TEXT,
  tokens_used       INT DEFAULT 0,
  is_cached         BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'rate_limited')),
  cost_estimate_usd NUMERIC(8, 6) DEFAULT 0.000000,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_idx ON public.ai_usage_logs (user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_idx ON public.ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_op_idx ON public.ai_usage_logs (operation_type);

-- 7. Table: user_tracked_topics
CREATE TABLE IF NOT EXISTS public.user_tracked_topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  topic      TEXT NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_topic_unique UNIQUE (user_id, topic)
);

CREATE INDEX IF NOT EXISTS user_tracked_topics_user_idx ON public.user_tracked_topics (user_id);

-- 8. Table: user_saved_intelligence
CREATE TABLE IF NOT EXISTS public.user_saved_intelligence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('item', 'trend', 'project', 'skill_gap', 'learning_topic', 'tool')),
  entity_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  notes       TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_saved_entity_unique UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS user_saved_intel_user_idx ON public.user_saved_intelligence (user_id);
CREATE INDEX IF NOT EXISTS user_saved_intel_type_idx ON public.user_saved_intelligence (user_id, entity_type);

-- 9. Enable RLS and permissive policies for server role
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tracked_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_intelligence ENABLE ROW LEVEL SECURITY;

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
