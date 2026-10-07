-- =============================================================================
-- AI Radar — Phase 6 Migration: Personal AI Intelligence Layer
-- =============================================================================
-- Adds tables for:
--   1. user_profiles (skills, technologies, career goals, learning goals, project interests)
--   2. career_signals (evidence-grounded market & technical trajectory signals)
--   3. skill_gaps (detected gaps with lightweight learning paths)
--   4. project_opportunities (actionable project ideas with skill matches & feasibility)
--   5. learning_topics (concept learning maps connected to collected intelligence)
--   6. user_intelligence_feedback (feedback, dismissals, notes & saved intelligence)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: user_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID UNIQUE,
  name                     TEXT,
  experience_level         TEXT NOT NULL DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'developing', 'intermediate', 'advanced')),
  primary_role_interest    TEXT NOT NULL DEFAULT 'AI Engineer',
  secondary_role_interests JSONB NOT NULL DEFAULT '["LLM Engineer", "AI Application Developer"]'::jsonb,
  skills                   JSONB NOT NULL DEFAULT '[{"name": "Python", "category": "Programming", "level": "intermediate"}, {"name": "Machine Learning", "category": "Machine Learning", "level": "developing"}]'::jsonb,
  technologies             JSONB NOT NULL DEFAULT '["Python", "PyTorch", "React", "FastAPI", "Docker", "Git"]'::jsonb,
  career_goals             JSONB NOT NULL DEFAULT '["Transition to AI Engineering", "Build production AI applications"]'::jsonb,
  learning_goals           JSONB NOT NULL DEFAULT '["Master AI Agents", "Understand LLM Evaluation & RAG"]'::jsonb,
  project_interests        JSONB NOT NULL DEFAULT '["Developer tools", "AI agents", "Workflow automation"]'::jsonb,
  preferred_topics         JSONB NOT NULL DEFAULT '["LLMs", "AI Agents", "Reasoning Models", "Developer Tools"]'::jsonb,
  excluded_topics          JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles (user_id);

COMMENT ON TABLE public.user_profiles IS
  'Explicit user skills, role interests, technologies, and career/project/learning goals.';

-- -----------------------------------------------------------------------------
-- 2. Table: career_signals
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_signals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_or_domain      TEXT NOT NULL,
  signal_type         TEXT NOT NULL CHECK (signal_type IN ('emerging_role', 'increasing_demand', 'architectural_shift', 'workflow_shift')),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  evidence_items      JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_trends   JSONB NOT NULL DEFAULT '[]'::jsonb,
  technologies        JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills              JSONB NOT NULL DEFAULT '[]'::jsonb,
  strength            TEXT NOT NULL DEFAULT 'moderate' CHECK (strength IN ('strong', 'moderate', 'emerging')),
  why_it_matters      TEXT,
  source_types        JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS career_signals_domain_idx ON public.career_signals (role_or_domain);
CREATE INDEX IF NOT EXISTS career_signals_strength_idx ON public.career_signals (strength);

COMMENT ON TABLE public.career_signals IS
  'Evidence-backed career and technology trajectory signals derived from research, tools, and repos.';

-- -----------------------------------------------------------------------------
-- 3. Table: skill_gaps
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_gaps (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID,
  skill_name              TEXT NOT NULL,
  skill_category          TEXT NOT NULL,
  relevance_reason        TEXT NOT NULL,
  gap_type                TEXT NOT NULL DEFAULT 'emerging' CHECK (gap_type IN ('untracked', 'level_up', 'emerging')),
  target_role             TEXT,
  associated_technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_items        JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_trends       JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_path           JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_action_status      TEXT NOT NULL DEFAULT 'active' CHECK (user_action_status IN ('active', 'saved', 'dismissed', 'in_progress', 'completed')),
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skill_gaps_user_idx ON public.skill_gaps (user_id);
CREATE INDEX IF NOT EXISTS skill_gaps_status_idx ON public.skill_gaps (user_action_status);

COMMENT ON TABLE public.skill_gaps IS
  'Identified potential skill investigation areas with lightweight learning pathways.';

-- -----------------------------------------------------------------------------
-- 4. Table: project_opportunities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_opportunities (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  problem_statement     TEXT NOT NULL,
  target_user           TEXT NOT NULL,
  proposed_solution     TEXT NOT NULL,
  why_now               TEXT NOT NULL,
  difficulty            TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('small', 'medium', 'large', 'advanced')),
  technical_stack       JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills       JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills_matched        JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills_to_learn       JSONB NOT NULL DEFAULT '[]'::jsonb,
  implementation_steps  JSONB NOT NULL DEFAULT '[]'::jsonb,
  potential_challenges  JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_items        JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_trend_slugs   JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_status           TEXT NOT NULL DEFAULT 'active' CHECK (user_status IN ('active', 'saved', 'dismissed', 'in_progress', 'built')),
  user_notes            TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_opportunities_slug_idx ON public.project_opportunities (slug);
CREATE INDEX IF NOT EXISTS project_opportunities_diff_idx ON public.project_opportunities (difficulty);

COMMENT ON TABLE public.project_opportunities IS
  'Evidence-grounded project opportunities with skill matches and feasibility analysis.';

-- -----------------------------------------------------------------------------
-- 5. Table: learning_topics
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_topics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  category         TEXT NOT NULL,
  summary          TEXT NOT NULL,
  why_relevant     TEXT NOT NULL,
  prerequisites    JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_concepts     JSONB NOT NULL DEFAULT '[]'::jsonb,
  technologies     JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_items    JSONB NOT NULL DEFAULT '[]'::jsonb,
  starter_project  TEXT,
  advanced_project TEXT,
  user_status      TEXT NOT NULL DEFAULT 'active' CHECK (user_status IN ('active', 'saved', 'dismissed')),
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS learning_topics_slug_idx ON public.learning_topics (slug);

COMMENT ON TABLE public.learning_topics IS
  'Concept learning maps directly connected to collected research, tools, and repositories.';

-- -----------------------------------------------------------------------------
-- 6. Table: user_intelligence_feedback
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_intelligence_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('item', 'trend', 'project', 'skill_gap', 'learning_topic', 'career_signal')),
  entity_id     TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('useful', 'not_relevant', 'already_know', 'interested', 'dismissed', 'saved')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_user_entity_idx ON public.user_intelligence_feedback (user_id, entity_type, entity_id);

COMMENT ON TABLE public.user_intelligence_feedback IS
  'Transparent user feedback (useful, dismissed, already know) adjusting personalization visibility.';

-- -----------------------------------------------------------------------------
-- 7. Row Level Security Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_intelligence_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_all" ON public.user_profiles;
CREATE POLICY "user_profiles_all" ON public.user_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "career_signals_all" ON public.career_signals;
CREATE POLICY "career_signals_all" ON public.career_signals FOR ALL USING (true);

DROP POLICY IF EXISTS "skill_gaps_all" ON public.skill_gaps;
CREATE POLICY "skill_gaps_all" ON public.skill_gaps FOR ALL USING (true);

DROP POLICY IF EXISTS "project_opportunities_all" ON public.project_opportunities;
CREATE POLICY "project_opportunities_all" ON public.project_opportunities FOR ALL USING (true);

DROP POLICY IF EXISTS "learning_topics_all" ON public.learning_topics;
CREATE POLICY "learning_topics_all" ON public.learning_topics FOR ALL USING (true);

DROP POLICY IF EXISTS "user_intelligence_feedback_all" ON public.user_intelligence_feedback;
CREATE POLICY "user_intelligence_feedback_all" ON public.user_intelligence_feedback FOR ALL USING (true);
