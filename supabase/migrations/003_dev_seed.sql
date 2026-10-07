-- =============================================================================
-- AI Radar — Development Seed Data
-- =============================================================================
-- PURPOSE: Provides clearly-labelled example records for local development
-- and UI testing. These records represent AI Radar's own internal state,
-- not real external intelligence.
--
-- IMPORTANT:
--   - These records are DEVELOPMENT DATA ONLY.
--   - They must never be presented to users as real live intelligence.
--   - Do not fabricate realistic company names, papers, or announcements.
--   - All names use "[DEV]" prefix so they are unmistakable in any UI.
--
-- Run AFTER 001_core_schema.sql and 002_row_level_security.sql.
-- Do NOT run in production unless you explicitly want these example records.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Example sources
-- ---------------------------------------------------------------------------

INSERT INTO public.sources (id, name, source_type, base_url, description, trust_level, active)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '[DEV] Example Research Feed',
    'research',
    'https://example-research.invalid',
    'Development seed source. Represents a research paper feed. Not a real source.',
    1,
    false   -- inactive so Phase 3 collectors do not try to fetch it
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '[DEV] Example News Source',
    'news',
    'https://example-news.invalid',
    'Development seed source. Represents a news outlet. Not a real source.',
    2,
    false
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '[DEV] Example Community Source',
    'community',
    'https://example-community.invalid',
    'Development seed source. Represents a community forum. Not a real source.',
    3,
    false
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Example items (development only)
-- ---------------------------------------------------------------------------

INSERT INTO public.items (id, source_id, external_id, canonical_url, title, description, item_type, published_at, discovered_at, metadata)
VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'dev-paper-001',
    'https://example-research.invalid/papers/dev-paper-001',
    '[DEV] Example Research Paper',
    'This is a development seed record for UI testing. It is not a real research paper.',
    'research_paper',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    '{"dev": true, "note": "seed data"}'
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000002',
    'dev-news-001',
    'https://example-news.invalid/articles/dev-news-001',
    '[DEV] Example AI News Item',
    'This is a development seed record for UI testing. It is not real news.',
    'announcement',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '12 hours',
    '{"dev": true, "note": "seed data"}'
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0001-000000000001',
    'dev-model-001',
    'https://example-research.invalid/models/dev-model-001',
    '[DEV] Example Model Release',
    'This is a development seed record for UI testing. It is not a real model release.',
    'model_release',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    '{"dev": true, "note": "seed data"}'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Example item-category assignments
-- ---------------------------------------------------------------------------

-- [DEV] Research Paper → models category
INSERT INTO public.item_categories (item_id, category_id)
SELECT '00000000-0000-0000-0002-000000000001', id
FROM public.categories WHERE slug = 'models'
ON CONFLICT DO NOTHING;

-- [DEV] News Item → ai-news category
INSERT INTO public.item_categories (item_id, category_id)
SELECT '00000000-0000-0000-0002-000000000002', id
FROM public.categories WHERE slug = 'ai-news'
ON CONFLICT DO NOTHING;

-- [DEV] Model Release → models AND ai-news (demonstrating multi-category)
INSERT INTO public.item_categories (item_id, category_id)
SELECT '00000000-0000-0000-0002-000000000003', id
FROM public.categories WHERE slug IN ('models', 'ai-news')
ON CONFLICT DO NOTHING;
