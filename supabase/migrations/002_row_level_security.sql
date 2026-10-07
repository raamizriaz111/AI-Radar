-- =============================================================================
-- AI Radar — Database Migration 002: Row Level Security
-- =============================================================================
-- Run AFTER 001_core_schema.sql
--
-- RLS philosophy for AI Radar:
--   - Public intelligence data (sources, items, categories, summaries, item_categories)
--     is readable by all users (anonymous and authenticated).
--     Write access is server-side only (via service role key).
--   - Private user data (profiles, bookmarks) is strictly protected per-user.
--     Users can only read and mutate their own bookmarks and profiles.
--   - collection_runs is server-side write only; readable by authenticated users
--     for diagnostics.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_runs  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles: users can only read and update their own profile
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- sources: readable by all; writes via service role only
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "sources_select_authenticated" ON public.sources;
DROP POLICY IF EXISTS "sources_select_all" ON public.sources;
CREATE POLICY "sources_select_all"
  ON public.sources FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- categories: readable by everyone
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- items: readable by all; writes via service role only
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "items_select_authenticated" ON public.items;
DROP POLICY IF EXISTS "items_select_all" ON public.items;
CREATE POLICY "items_select_all"
  ON public.items FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- item_categories: readable by all
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "item_categories_select_authenticated" ON public.item_categories;
DROP POLICY IF EXISTS "item_categories_select_all" ON public.item_categories;
CREATE POLICY "item_categories_select_all"
  ON public.item_categories FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- summaries: readable by all; writes via service role only
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "summaries_select_authenticated" ON public.summaries;
DROP POLICY IF EXISTS "summaries_select_all" ON public.summaries;
CREATE POLICY "summaries_select_all"
  ON public.summaries FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- bookmarks: fully user-scoped — users only see and modify their own
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- collection_runs: readable by authenticated users for diagnostics
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "collection_runs_select_authenticated" ON public.collection_runs;
DROP POLICY IF EXISTS "collection_runs_select_all" ON public.collection_runs;
CREATE POLICY "collection_runs_select_all"
  ON public.collection_runs FOR SELECT
  USING (true);
