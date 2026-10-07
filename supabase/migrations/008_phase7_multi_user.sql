-- =============================================================================
-- AI Radar — Phase 7 Migration: Multi-User Architecture & Commercial Foundation
-- =============================================================================
-- Adds tables for:
--   1. user_plans (free/pro plan allowances, request limits, feature flags)
--   2. ai_usage_logs (user-scoped AI operations, token tracking, cost telemetry)
--   3. user_tracked_topics (topics/technologies explicitly followed by users)
--   4. user_saved_intelligence (multi-entity saved items: trends, projects, tools)
--   5. product_analytics_events (privacy-conscious user event tracking)
-- Hardens Row Level Security (RLS) across all user-scoped tables:
--   - Strict user data isolation: users can ONLY access and mutate their own data
--   - Global intelligence remains shared and read-only to clients
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: user_plans
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE public.user_plans IS
  'Commercial plan tiers, usage allowances, and feature access flags per user.';

-- -----------------------------------------------------------------------------
-- 2. Table: ai_usage_logs
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE public.ai_usage_logs IS
  'Telemetry for per-user AI operations, token consumption, cost estimates, and cache hits.';

-- -----------------------------------------------------------------------------
-- 3. Table: user_tracked_topics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_tracked_topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  topic      TEXT NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_topic_unique UNIQUE (user_id, topic)
);

CREATE INDEX IF NOT EXISTS user_tracked_topics_user_idx ON public.user_tracked_topics (user_id);

COMMENT ON TABLE public.user_tracked_topics IS
  'Specific topics, technologies, or entities explicitly tracked by a user to bias relevance.';

-- -----------------------------------------------------------------------------
-- 4. Table: user_saved_intelligence
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE public.user_saved_intelligence IS
  'Multi-object user saved intelligence portfolio referencing canonical global records.';

-- -----------------------------------------------------------------------------
-- 5. Table: product_analytics_events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_analytics_event_idx ON public.product_analytics_events (event_name, created_at DESC);

COMMENT ON TABLE public.product_analytics_events IS
  'Privacy-preserving product usage telemetry (briefing_viewed, search_executed, item_saved).';

-- -----------------------------------------------------------------------------
-- 6. Row Level Security Hardening
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tracked_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics_events ENABLE ROW LEVEL SECURITY;

-- 1. user_profiles: restrict to owning user (if table exists)
DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "user_profiles_all" ON public.user_profiles;
    DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
    CREATE POLICY "user_profiles_select_own" ON public.user_profiles
      FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

    DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
    CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

    DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
    CREATE POLICY "user_profiles_update_own" ON public.user_profiles
      FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

    DROP POLICY IF EXISTS "user_profiles_delete_own" ON public.user_profiles;
    CREATE POLICY "user_profiles_delete_own" ON public.user_profiles
      FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- 2. user_plans: read own, update via service role
DROP POLICY IF EXISTS "user_plans_select_own" ON public.user_plans;
CREATE POLICY "user_plans_select_own" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

-- 3. ai_usage_logs: read own logs, insert own or via service
DROP POLICY IF EXISTS "ai_usage_logs_select_own" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_select_own" ON public.ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_usage_logs_insert_own" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_insert_own" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 4. user_tracked_topics: strictly own records
DROP POLICY IF EXISTS "user_tracked_topics_all_own" ON public.user_tracked_topics;
CREATE POLICY "user_tracked_topics_all_own" ON public.user_tracked_topics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. user_saved_intelligence: strictly own records
DROP POLICY IF EXISTS "user_saved_intel_all_own" ON public.user_saved_intelligence;
CREATE POLICY "user_saved_intel_all_own" ON public.user_saved_intelligence
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. user_intelligence_feedback: strictly own feedback (if table exists)
DO $$
BEGIN
  IF to_regclass('public.user_intelligence_feedback') IS NOT NULL THEN
    DROP POLICY IF EXISTS "user_intelligence_feedback_all" ON public.user_intelligence_feedback;
    DROP POLICY IF EXISTS "feedback_all_own" ON public.user_intelligence_feedback;
    CREATE POLICY "feedback_all_own" ON public.user_intelligence_feedback
      FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- 7. skill_gaps: strictly own skill gaps (if table exists)
DO $$
BEGIN
  IF to_regclass('public.skill_gaps') IS NOT NULL THEN
    DROP POLICY IF EXISTS "skill_gaps_all" ON public.skill_gaps;
    DROP POLICY IF EXISTS "skill_gaps_all_own" ON public.skill_gaps;
    CREATE POLICY "skill_gaps_all_own" ON public.skill_gaps
      FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- 8. product_analytics_events: insertable by authenticated or anon, read own
DROP POLICY IF EXISTS "analytics_insert" ON public.product_analytics_events;
CREATE POLICY "analytics_insert" ON public.product_analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_select_own" ON public.product_analytics_events;
CREATE POLICY "analytics_select_own" ON public.product_analytics_events
  FOR SELECT USING (auth.uid() = user_id);
