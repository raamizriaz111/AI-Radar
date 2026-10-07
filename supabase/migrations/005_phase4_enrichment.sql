-- =============================================================================
-- AI Radar — Migration 005: Phase 4 AI Enrichment Schema Enhancements
-- =============================================================================
-- Adds structured enrichment fields to the summaries table and an
-- enrichment status tracker to the items table.
--
-- Safe and idempotent (uses ADD COLUMN IF NOT EXISTS).
-- Does not destroy any existing Phase 2 or Phase 3 data.
-- =============================================================================

-- 1. Extend summaries table with structured intelligence fields
ALTER TABLE public.summaries
  ADD COLUMN IF NOT EXISTS entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS suggested_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS suggested_item_type TEXT,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS warning_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS usage JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.summaries.entities IS
  'JSONB array of extracted entities: [{name: string, type: string}]';
COMMENT ON COLUMN public.summaries.technologies IS
  'JSONB array of extracted technologies and libraries: ["PyTorch", "Transformers", ...]';
COMMENT ON COLUMN public.summaries.topics IS
  'JSONB array of high-level topics: ["LLM", "Agents", ...]';
COMMENT ON COLUMN public.summaries.suggested_categories IS
  'JSONB array of AI-suggested category slugs. Never silently overwrites source item categories.';
COMMENT ON COLUMN public.summaries.prompt_version IS
  'Semver string of the prompt template used to generate this enrichment.';
COMMENT ON COLUMN public.summaries.warning_flags IS
  'JSONB array of caution flags: ["unverified_benchmark", "promotional_language", ...]';

-- 2. Extend items table with enrichment pipeline status
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enrichment_error TEXT;

-- Update existing items that already have summaries to 'completed'
UPDATE public.items
SET enrichment_status = 'completed'
WHERE id IN (SELECT item_id FROM public.summaries);

-- Index for querying un-enriched or failed items
CREATE INDEX IF NOT EXISTS items_enrichment_status_idx
  ON public.items (enrichment_status);
