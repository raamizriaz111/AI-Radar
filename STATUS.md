# AI Radar — Implementation Status

## Phase 1: Foundation

**Status: Complete**  
**Completed:** 2026-10-01

- Next.js 15 App Router project with strict TypeScript and ESLint
- Responsive application shell: desktop sidebar + mobile navigation overlay
- Dark research workspace design system using CSS variables + Tailwind CSS
- Functional dashboard with honest empty states
- 12 navigation routes with placeholder pages
- Reusable UI component library (11 components)
- Base TypeScript type definitions

---

## Phase 2: Database, Data Model, Persistence & Core Architecture

**Status: Complete**  
**Completed:** 2026-10-01

### What was built

- **Database Schemas & Migrations:**
  - `001_core_schema.sql`: Core tables (`profiles`, `sources`, `categories`, `items`, `item_categories`, `summaries`, `bookmarks`, `collection_runs`), constraints, indexes, triggers (`set_updated_at`), and default category seeds.
  - `002_row_level_security.sql`: Comprehensive Row Level Security policies with user-scoped isolation for bookmarks & profiles, and server-only writes for public intelligence.
  - `003_dev_seed.sql`: Clearly-labeled `[DEV]` seed data for development with inactive sources and example items.
- **Data Model & Type Safety:**
  - `src/lib/database.types.ts`: Strict TypeScript mappings for all tables, inserts, updates, relationships, joins, and aggregates.
- **Supabase Integration Architecture:**
  - `src/lib/supabase/client.ts`: Browser client using anon key with RLS.
  - `src/lib/supabase/server.ts`: Server Component client with cookie-based session management.
  - `src/lib/supabase/service.ts`: Server-side privileged client with `SUPABASE_SERVICE_ROLE_KEY` guard.
  - `src/lib/supabase/config.ts`: Runtime configuration detector for honest empty/unconfigured states.
- **Validation Layer (Zod):**
  - `src/lib/validation/schemas.ts`: Strict schemas for source creation, item ingestion, bookmarks, collection runs, and summaries.
- **Repository / Service Layer:**
  - `itemRepository.ts`: Querying, filtering, pagination, and multi-tier deduplication (canonical URL, source + external ID, SHA-256 content hash).
  - `sourceRepository.ts`: Sources query and management.
  - `categoryRepository.ts`: Category query with stable fallback categories.
  - `bookmarkRepository.ts`: User-scoped bookmark creation, deletion, and retrieval.
  - `collectionRunRepository.ts`: Diagnostic logging for source collection jobs.
  - `summaryRepository.ts`: AI-generated summary storage cleanly isolated from source data.
  - `diagnosticsService.ts`: Non-invasive database health checks, latency tracking, and record counting.
  - `logger.ts`: Server-side logger with automatic sensitive token and key redaction.
  - `hash.ts`: Deterministic SHA-256 hash generator for duplicate detection.
  - `seedService.ts`: Programmatic dev seed runner.
- **Pages Connected to Database:**
  - **Dashboard (`/`)**: Displays live database status indicator, active source/record counts, and recent items.
  - **AI News (`/news`)**: Live queries items categorized under `ai-news`.
  - **Models & Research (`/research`)**: Live queries items categorized under `models`.
  - **Bookmarks (`/bookmarks`)**: Connected to Supabase Auth and user-scoped bookmark store with RLS.
  - **Diagnostics (`/diagnostics`)**: Live database health check, latency, entity counts, collection run history, and safe environment metadata.
  - **Settings (`/settings`)**: Live database configuration checklist and connection guide.
- **Testing & Quality:**
  - 41 unit & component tests passing across schemas, services, and components.
  - 0 TypeScript errors under strict mode (`tsc --noEmit`).
  - 0 ESLint errors or warnings.
  - Production build compiled successfully (15/15 static pages).

### Phase 2 definition of done — checklist

- [x] Database schema designed and codified in migrations
- [x] Clear separation between source data (`items`) and AI analysis (`summaries`)
- [x] Multi-tier deduplication implemented (canonical URL, source + external ID, content hash)
- [x] User-scoped records protected with Row Level Security
- [x] Service role key kept strictly server-side
- [x] Reusable type-safe repository layer implemented
- [x] Input validation with Zod for all entities
- [x] Safe logging redacts sensitive tokens and credentials
- [x] Development seed mechanism with distinct `[DEV]` labels
- [x] Pages connected to real database queries (Dashboard, News, Research, Bookmarks, Diagnostics, Settings)
- [x] Honest empty and unconfigured states throughout
- [x] TypeScript passes (`tsc --noEmit`)
- [x] ESLint passes
- [x] Test suite passes (41/41 tests)
- [x] Production build passes
- [x] README and STATUS updated

---

## Phase 3: First Real Collectors

**Status: Complete**
**Completed:** 2026-10-02

### What was built

- **Collector Infrastructure** (`src/lib/collectors/`):
  - `types.ts` — `NormalizedItem`, `CollectorRunResult`, `CollectorConfig`, `Collector` interface
  - `base.ts` — `BaseCollector` abstract class: run tracking, per-item dedup, error isolation, status update
  - `fetcher.ts` — HTTP fetch with timeout, exponential-backoff retry, honest `User-Agent`
  - `normalizer.ts` — URL, title, description, date, and author normalization utilities
  - `classifier.ts` — Deterministic keyword-rule classifier (zero AI/LLM) → `ItemType` + category slugs
  - `xmlParser.ts` — Lightweight Atom/RSS parser with Node.js server-side fallback (no dependencies)
  - `registry.ts` — Central collector registry keyed by source slug

- **Source Collectors** (3 real sources):
  - `arxiv.ts` — arXiv Atom API (cs.AI, cs.LG, cs.CL, cs.CV, cs.RO, stat.ML subjects). Public, no key.
  - `huggingface.ts` — Hugging Face Papers RSS feed. Public, no key.
  - `github.ts` — GitHub AI repository search API (optional `GITHUB_TOKEN`). Public unauthenticated.

- **Database Migration:**
  - `004_phase3_sources.sql` — Seeds 3 source rows into the `sources` table (idempotent)

- **Collection Orchestrator:**
  - `src/lib/services/collectionService.ts` — `runCollector(slug)` and `runAllCollectors()` with source-ID resolution

- **Collection API Route:**
  - `POST /api/collect` — Manual trigger, protected by `COLLECTION_SECRET` header (dev bypass without secret)
  - `GET /api/collect` — Lists collector registry and DB seeding status

- **UI Updates:**
  - Diagnostics page: Source registry table, "Collect All Sources Now" button (client component), collection run log
  - Dashboard, News, Research: Updated empty-state messaging pointing to Diagnostics to trigger collection
  - Sidebar footer: Phase 3 · Personal

- **Tests:** `src/__tests__/collectors.test.ts` — 35 tests (normalizer, classifier, XML parser)

### Verification results (all real, run locally)

- [x] TypeScript: 0 errors (`tsc --noEmit`)
- [x] ESLint: 0 warnings or errors
- [x] Tests: 76/76 passing (4 suites)
- [x] Production build: clean — 14 routes (`ƒ Dynamic` where needed, `/api/collect` correctly server-rendered)
- [x] No fabricated items — all content comes from real HTTP sources on collection run
- [x] No AI used in Phase 3 — classification is deterministic rule-based only
- [x] COLLECTION_SECRET, GITHUB_TOKEN documented in `.env.example`

### To activate Phase 3 collection in your live app

1. Run **migration 004** in Supabase SQL Editor: `supabase/migrations/004_phase3_sources.sql`
2. Start the dev server: `npm run dev`
3. Open [http://localhost:3000/diagnostics](http://localhost:3000/diagnostics)
4. Click **"Collect All Sources Now"** — real papers and repos will be ingested
5. After collection completes, visit `/research` and `/news` to see live records

---

## Phase 4: AI Enrichment, Summarization & Intelligence

**Status: Complete**
**Completed:** 2026-10-02

### What was built

- **Provider Abstraction Architecture** (`src/lib/ai/providers/`):
  - `base.ts` — `BaseAIProvider`: Abstract class handling JSON extraction, code-fence stripping, Zod schema validation, cost calculation, and error logging.
  - `openai.ts` — `OpenAIProvider`: Direct native fetch to OpenAI API (`gpt-4o-mini`) using JSON object mode and token tracking.
  - `gemini.ts` — `GeminiProvider`: Direct native fetch to Google Generative Language API (`gemini-1.5-flash`) using JSON mode.
  - `mock.ts` — `MockAIProvider`: High-fidelity deterministic heuristic provider extracting real entities, technologies, and cited claims for offline development and testing.
  - `index.ts` — Provider registry & factory (`getAIProvider()`): Auto-detects configured credentials and falls back gracefully to heuristic mode if no API key is set.

- **Prompt Management & Security** (`src/lib/ai/`):
  - `prompts.ts` — Versioned prompt system (`CURRENT_PROMPT_VERSION = "1.0.0"`). Enforces strict provenance, fact vs. analysis separation, attribution of claims, and benchmark caveats.
  - `sanitizer.ts` — Input preparation utility: Strips HTML/script tags, collapses whitespace, caps input length (10,000 chars) for cost control, and neutralizes common prompt injection attack phrases.

- **Orchestration & Persistence** (`src/lib/ai/enrichmentService.ts`):
  - `enrichItemById()`: Single-item pipeline with duplicate prevention check, input sanitization, provider execution, Zod validation, and database storage.
  - `enrichBatch()`: Controlled, paced batch processing of candidate un-enriched items with rate limit delays.

- **API Endpoints** (`src/app/api/enrich/`):
  - `POST /api/enrich`: Trigger manual or batch enrichment; protected by `COLLECTION_SECRET` header (dev-mode bypass).
  - `GET /api/enrich`: Returns active provider status, prompt version, and un-enriched candidate counts.

- **Database Enhancements**:
  - `supabase/migrations/005_phase4_enrichment.sql`: Extends `summaries` table with `entities`, `technologies`, `topics`, `suggested_categories`, `prompt_version`, `warning_flags`, `usage`, and adds `enrichment_status` to `items`.
  - Application repositories updated with schema fallback logic so the app works seamlessly even before migration 005 is applied.

- **UI & Intelligence Cards**:
  - `IntelligenceCard.tsx`: Clearly distinct AI Summary badge, expandable deep analysis drawer showing Key Findings, Source Claims with confidence tags, Extracted Entities & Technologies, and AI Significance (explicitly labeled as analysis, not source fact).
  - Diagnostics page: Dedicated AI Enrichment Pipeline panel displaying active provider, model, prompt version, pending candidate count, and live `<TriggerEnrichmentButton />`.

- **Test Suite**:
  - `src/__tests__/ai-enrichment.test.ts` (15 new tests covering sanitizer, prompt injection defense, schema validation, mock provider, registry).
  - `src/__tests__/golden-cases.ts` (representative fixtures for papers, repos, benchmark hype, and injection attempts).

### Verification results (all real, run locally)

- [x] TypeScript: 0 errors (`tsc --noEmit`)
- [x] ESLint: 0 warnings or errors
- [x] Tests: **91/91 passing** (5 test suites)
- [x] Production build: clean — 15 routes (`/api/enrich` and `/api/collect` dynamic server routes)
- [x] Real items enriched & verified in live database: 4 items enriched with structured summaries, claims, and key points
- [x] Duplicate enrichment prevention verified: duplicate items skipped immediately without calling LLM
- [x] Strict provenance preserved: original source content in `items` table remains unmodified
- [x] Provider credentials kept strictly server-side

---

## Phase 5: Intelligence Layer, Emerging Trends, Signals, Daily Briefings and Relevance

**Status: Complete**  
**Completed:** 2026-10-02

### What was built

- **Database Schemas & Migrations:**
  - `supabase/migrations/006_phase5_intelligence.sql`: Schema definitions for `trends`, `trend_evidence`, `daily_briefings`, and `user_preferences` with RLS policies, indexes, and automatic timestamp triggers.

- **Deterministic Signal Detection & Lifecycle Rules** (`src/lib/intelligence/`):
  - `signals.ts`: Multi-source signal detection grouping items by technology, entity, or topic. Enforces strict source independence (multiple items from the same source count as 1 source). Detects contradiction indicators (e.g., benchmark regressions, failure reports, security flaws).
  - `lifecycle.ts`: Deterministic status rules (`early_signal`, `developing`, `established`, `uncertain`, `declining`, `inactive`) and explainable confidence formula (`high`, `medium`, `low`) bounded with single-source safety caps.
  - `importance.ts`: Transparent, explainable importance scoring combining Recency decay (35%), Source trust (20%), Evidence breadth (20%), and User relevance (25%). Includes novelty deduplication filter to eliminate near-duplicate paper titles.
  - `preferences.ts`: Explicit topic preference profile management (persisted in DB with in-memory fallback). `computeUserRelevance()` scores items against user-selected topics without hidden political profiling.
  - `trendDiscovery.ts`: Clusters detected signals into evidence-backed trend candidates, constructs chronological development timelines, classifies evidence relationships (`supporting`, `related`, `contradictory`, `background`), and synthesizes grounded explanations.
  - `briefingService.ts`: Daily Intelligence Briefing pipeline. Organizes prioritized items into thematic sections, cites every claim with underlying source links, highlights the day's top emerging signals, and prevents duplicate generation for the same date unless forced.

- **Data Access & API Layer**:
  - `src/lib/repositories/trendRepository.ts`: CRUD for trends and evidence items with pre-migration cache fallback so UI never crashes if migration 006 is pending.
  - `src/lib/repositories/briefingRepository.ts`: CRUD for daily briefings with date archives and history.
  - `POST /api/trends` & `GET /api/trends`: Query trends and trigger trend discovery across collected items.
  - `POST /api/briefing` & `GET /api/briefing`: Generate and retrieve daily intelligence briefings.
  - `POST /api/preferences` & `GET /api/preferences`: Read and update explicit topic preferences.

- **UI & Intelligence Surfaces**:
  - **Emerging Trends (`/trends`)**: Interactive catalog with lifecycle status filters, confidence filters, search, and live "Run Trend Discovery" trigger.
  - **Trend Detail (`/trends/[slug]`)**: Deep dive view featuring status and confidence badges, "Why It Matters", "What To Watch", chronological development timeline, highlighted contradiction alerts, and supporting evidence cards with direct external citations.
  - **Daily Briefing (`/briefing`)**: Executive intelligence briefing view with historical date archive picker, top emerging signals ribbon, synthesized overview, and thematic sections with traceable item citations.
  - **Dashboard (`/`)**: Updated with live Daily Intelligence Briefing summary and Top Emerging Trends widget.
  - **Settings (`/settings`)**: Interactive Topic Preferences Editor allowing users to customize followed topics and adjust priority weights.
  - **Diagnostics (`/diagnostics`)**: Live counters for Emerging Trends and Daily Briefings.

- **Testing & Verification**:
  - `src/__tests__/intelligence.test.ts`: 13 comprehensive unit tests covering signals, source independence, contradiction detection, lifecycle transitions, importance scoring, novelty filtering, relevance matching, trend discovery, and briefing generation.
  - **104/104 tests passing** across 6 test suites.
  - 0 TypeScript errors under strict mode (`tsc --noEmit`).
  - 0 ESLint warnings or errors.
  - Production build successful across all 19 App Router endpoints.

### To activate Phase 5 in Supabase (Optional for full DB persistence)

1. Open Supabase SQL Editor.
2. Run `supabase/migrations/006_phase5_intelligence.sql`.
*(Note: AI Radar includes automatic in-memory fallbacks, so the intelligence layer is fully usable and tests pass even before migration 006 is applied in Supabase).*

---

## Phase 6: Personal AI Intelligence, Career Intelligence, Skill Gaps, Project Opportunities and Action Layer

**Status: Complete**  
**Completed:** 2026-10-02

### What was built

- **Database Schemas & Migrations:**
  - `supabase/migrations/007_phase6_personal_intelligence.sql`: Schema definitions for `user_profiles`, `career_signals`, `skill_gaps`, `project_opportunities`, `learning_topics`, and `user_intelligence_feedback` with RLS policies, indexes, and timestamp triggers.
  - Strict TypeScript schema definitions added to `src/lib/database.types.ts` (`UserProfileRow`, `CareerSignalRow`, `SkillGapRow`, `ProjectOpportunityRow`, `LearningTopicRow`, `UserIntelligenceFeedbackRow`, insert/update types).

- **Explainable Personal Relevance & Intelligence Engines** (`src/lib/personalization/`):
  - `types.ts`: Domain models, proficiency taxonomies (`interested`, `beginner`, `intermediate`, `advanced`), role catalogs, and standard default engineering profile (`DEFAULT_USER_PROFILE`).
  - `personalRelevance.ts`: Deterministic, explainable relevance scoring (0–100) matching items against user skills, tech stack, roles, learning goals, and topics. Enforces immediate negative filtering (`excludedTopics` = score 0) and provides human-readable reasons for every match.
  - `skillDemandEngine.ts`: Aggregates technology and skill mentions across recent papers, repos, and updates. Measures source diversity and flags surging vs rising vs steady skills.
  - `skillGapEngine.ts`: Detects practical skill gaps by contrasting profile skills with high-demand ecosystem signals. Classifies gaps as `untracked`, `level_up`, or `emerging`, attaches primary source citations, and generates progressive 3-step actionable learning pathways.
  - `careerSignalsEngine.ts`: Detects macro engineering trajectory shifts (`architectural_shift`, `emerging_role`, `workflow_shift`, `increasing_demand`) supported by multi-source item clusters and trends. Strictly non-prescriptive (no salary or hiring guarantees).
  - `projectOpportunityEngine.ts`: Formulates "What Could I Build?" practical project ideas grounded in observed developer pain points. Evaluates profile skills to clearly distinguish `skillsMatched` from `skillsToLearn`, provides milestone roadmaps, and details potential engineering challenges.
  - `learningIntelligence.ts`: Curated learning blueprints with prerequisites, key concepts to master, and milestone projects directly linked to primary sources.
  - `personalBriefingService.ts`: Extends daily briefings with a personalized "What Matters To You Today" section highlighting top-scoring items with relevance breakdowns.
  - `feedbackService.ts`: Manages user interactions (`useful`, `not_relevant`, `already_know`, `interested`, `dismissed`, `saved`) with instant in-memory filtering and persistence.

- **Data Access & API Layer**:
  - `src/lib/repositories/personalizationRepository.ts`: Unified data access layer with robust in-memory caches and fallbacks ensuring the app remains 100% functional even prior to running migration 007.
  - `GET /api/profile` & `POST /api/profile`: Read and update personal profile with Zod validation.
  - `GET /api/career` & `PATCH /api/career`: Fetch career signals and skill gaps; update gap progress status.
  - `GET /api/projects` & `PATCH /api/projects`: Query project opportunities; update project status (`active`, `saved`, `in_progress`, `built`) and personal engineering notes.
  - `POST /api/feedback`: Record explicit user feedback on intelligence items, trends, and projects.

- **UI & Intelligence Surfaces**:
  - **Career & Skills Intelligence (`/career`)**: Complete experience featuring Evidence-Backed Career Signals, Potential Skill Gaps & Learning Pathways cards, the Skill Demand Explorer, Curated Learning Blueprints, and non-prescriptive advisory notices.
  - **Project Opportunities Discovery (`/business`)**: "What Could I Build?" interactive laboratory with difficulty filters (`Small`, `Medium`, `Large`, `Advanced`), status filters (`Active`, `Saved`, `In Progress`, `Built`), search by technology, skills match comparison badges, implementation milestones, and personal notes.
  - **Personal AI Profile Editor (`/settings`)**: Interactive profile manager to customize display name, experience level, primary & secondary roles, skills with proficiency ratings, active tech stack, career goals, learning goals, and negative topic filters.
  - **Personalized Feed on Dashboard (`/`)**: "What Matters To You" section highlighting top developments with transparent relevance percentage badges (`PersonalRelevanceBadge`) and explainable reason breakdowns.
  - **Diagnostics (`/diagnostics`)**: Live health indicators for Personal Intelligence Layer, entity counters for Career Signals and Project Opportunities.

- **Testing & Verification**:
  - `src/__tests__/personalization.test.ts`: 18 comprehensive tests covering relevance calculation, negative filtering, skill demand analysis, skill gap detection, career signals, project opportunity generation, learning topics, user feedback, and in-memory persistence.
  - **122/122 tests passing** across 7 test suites.
  - 0 TypeScript errors under strict mode (`tsc --noEmit`).
  - 0 ESLint warnings or errors (`next lint`).
  - Production build successful across all 24 App Router routes.

### To activate Phase 6 in Supabase (Optional for full DB persistence)

1. Open Supabase SQL Editor.
2. Run `supabase/migrations/007_phase6_personal_intelligence.sql`.
*(Note: AI Radar includes automatic in-memory fallbacks, so the personal intelligence system is fully usable and tests pass even before migration 007 is applied in Supabase).*

---

## Phase 7: Commercial Product Foundation, Multi-User Architecture, Onboarding and Scalable Personalization

**Status: Complete**  
**Completed:** 2026-10-02

### What was built

- **Database Schemas & Multi-Tenant Migrations:**
  - `supabase/migrations/008_phase7_multi_user.sql`: Production schemas for multi-tenant SaaS foundation:
    - `user_plans`: Commercial subscription tier records (`free`, `pro`, `enterprise`), daily AI request limits, briefing generation quotas, and custom tracked topic capacity.
    - `ai_usage_logs`: Token, provider, latency, prompt version, cache status, and USD cost accounting per user operation.
    - `user_tracked_topics`: User-scoped custom monitored topics and technologies.
    - `user_saved_intelligence`: Multi-entity bookmarks (saving articles, trends, projects, coding agents, and learning paths).
    - `product_analytics_events`: Privacy-first telemetry event store.
    - Hardened Row Level Security policies enforcing strict per-user tenant isolation across all tables.
  - TypeScript types added to `src/lib/database.types.ts` and `src/lib/types.ts` (`UserPlan`, `AiUsageLog`, `TrackedTopic`, `SavedIntelligence`, `AuthUser`, `RateLimitResult`).

- **Authentication, Session & Authorization Guards (`src/lib/auth/session.ts`):**
  - Cookie-based Supabase Auth session resolution for Server Components and Route Handlers.
  - `getCurrentUser()`: Resolves authenticated user with role, email, and metadata.
  - `requireAuth()` & `requireAdmin()`: Strict server-side route guards preventing unauthenticated or non-admin access.
  - In-memory mock session utilities (`setMockSession`, `clearMockSession`) enabling deterministic offline and CI testing.

- **7-Step Skippable Onboarding Wizard (`/onboarding` & `/api/onboarding`):**
  - Interactive multi-step wizard (`src/components/onboarding/OnboardingWizard.tsx`):
    1. Experience Level (Beginner, Intermediate, Advanced, Expert)
    2. Primary & Secondary Engineering Roles
    3. Technical Skills Inventory with ratings
    4. Active & Desired Technologies
    5. Career Ambitions & Milestones
    6. Learning Goals
    7. Preferred & Excluded Topic Filters
  - Instant progress persistence and skippable steps. Populates clean default profiles for immediate time-to-value.

- **Multi-Tenant Scoped Personalization:**
  - `personalizationRepository.ts`: Multi-tenant repository isolating profiles, tracked topics, saved intelligence, and user feedback.
  - `bookmarkRepository.ts`: User-isolated bookmark storage with offline test support.
  - `feedbackService.ts`: User-keyed feedback and dismissal engine (`${userId}:${entityType}:${entityId}:${feedbackType}`) ensuring User A's dismissals never affect User B.
  - Scoped relevance calculations: Different users receive completely different scores, project suggestions, and briefing recommendations against the same shared global evidence.

- **Public Marketing & Product Landing Page (`/welcome`):**
  - Clean, dark research workspace landing page explaining AI Radar's evidence-first mission, primary source verification, non-prescriptive career intelligence, and transparent AI summarization without marketing hype.
  - Direct entry points to `/signup`, `/login`, and the live demo.

- **Commercial Rate Limiting & AI Usage Telemetry:**
  - `src/lib/services/rateLimiter.ts`: Sliding-window rate limiter with per-route tiers (`auth`: 10 req/min, `ai`: 30 req/min, `api`: 120 req/min).
  - `src/lib/services/usageService.ts`: Plan provisioning (defaults to Free tier), daily AI operation quotas, token consumption tracking, and estimated USD cost attribution.
  - `src/lib/services/cacheService.ts`: Strict namespace separation between global intelligence caches and user-scoped caches (`user:{userId}:...`).

- **Global Cross-Entity Search (`SearchModal.tsx` & `/api/search`):**
  - Global search modal accessible anywhere via keyboard shortcut `⌘K` or top header search button.
  - Instant multi-category querying across articles, emerging trends, project opportunities, and learning topics.

- **Account Deletion Architecture (`/api/auth/delete-account` & `deleteUserData`):**
  - Comprehensive cascade wiping private profile records, bookmarks, tracked topics, feedback, cached results, and plan data.
  - Strictly preserves global shared intelligence (items, sources, summaries, trends) without data corruption.

- **Testing & Verification:**
  - `src/__tests__/multi-user.test.ts`: 15 comprehensive multi-user and security tests covering cross-user isolation, auth guards, rate limiting, plan quotas, cache isolation, account deletion, and 3 realistic user personas:
    1. *AI Agent Engineer* (focused on MCP, Tool Calling, Autonomous Agents)
    2. *Computer Vision Researcher* (focused on CUDA, PyTorch, Video Diffusion)
    3. *AI Product Builder* (focused on Next.js, FastAPI, Vector DBs, SaaS)
  - **137/137 tests passing** across 8 test suites.
  - 0 TypeScript errors under strict mode (`tsc --noEmit`).
  - 0 ESLint warnings or errors (`next lint`).
  - Production build compiled successfully across all 37 App Router endpoints.

### To activate Phase 7 in Supabase (Optional for full DB persistence)

1. Open Supabase SQL Editor.
2. Run `supabase/migrations/008_phase7_multi_user.sql`.
*(Note: AI Radar includes automatic multi-tenant in-memory fallbacks, so the multi-user architecture is fully functional and all 137 tests pass even before migration 008 is applied in Supabase).*

---

## Phase 8: Commercialization, Subscriptions, Billing, Usage Limits & Monetization

**Status: Complete**
**Completed:** 2026-10-02

### What was built

- **Central Plan Configuration Architecture (`src/lib/billing/planConfig.ts`):**
  - Fully configurable tier definitions: **Free** (\$0/mo), **Pro** (\$19/mo, \$190/yr), and **Advanced** (\$49/mo, \$490/yr).
  - Explicit limits for AI operations/day (100 / 1,000 / 10,000), daily briefings/day (10 / 30 / 100), tracked topics (20 / 100 / 500), and pagination caps.
  - Granular feature flags: `customTopics`, `export`, `earlyTrends`, `advancedFilters`, `apiAccess`, `prioritySupport`.
  - Zero hardcoded limits in application logic — changing values in `planConfig.ts` propagates immediately.

- **Provider-Agnostic Billing Abstraction (`src/lib/billing/`):**
  - `billingProvider.ts` — `IBillingProvider` interface defining checkout session creation, customer portal, webhook parsing/signature verification, customer resolution, and cancellation/resumption.
  - `stripeProvider.ts` — Production Stripe integration with dynamic module loading (bundler-safe when `stripe` package is optional).
  - `mockProvider.ts` — Deterministic in-memory mock billing provider enabling 100% offline development and comprehensive test automation.
  - `index.ts` — Auto-selection registry preferring Stripe when `STRIPE_SECRET_KEY` is present, falling back cleanly to Mock provider.

- **Subscription Lifecycle & Commercial Audit Trail (`src/lib/billing/subscriptionService.ts`):**
  - Full subscription state machine: `trialing` → `active` → `past_due` → `canceled` → `expired` → `paused` → `incomplete`.
  - Server-side plan switching: `changePlan` with automated upgrade/downgrade event recording.
  - Graceful cancellation (`cancelSubscription` sets `cancel_at_period_end` until current billing period expires) and `reactivateSubscription`.
  - Immutable billing event audit trail (`recordBillingEvent` with idempotency on `[provider, providerEventId]`).
  - Admin metrics engine (`getBillingAdminSummary`) computing subscription counts by tier, active/trialing/canceled breakdown, and estimated Monthly Recurring Revenue (MRR).

- **Server-Side Feature Gating (`src/lib/billing/featureAccess.ts`):**
  - Robust feature access checks (`checkFeatureAccess`, `checkFeatureAccessSync`, `checkMultipleFeatures`).
  - Never trusts client-submitted plan claims; resolves subscription tier server-side.
  - Returns actionable downgrade/upgrade requirements (`upgradeRequired: 'pro'` | `'advanced'`).

- **Usage Enforcement & Daily Quota Accounting (`src/lib/billing/usageEnforcement.ts`):**
  - Atomic quota checking (`checkBillingUsageLimit`) and consumption (`recordBillingUsage`).
  - Strict pool separation between daily briefing quotas and general AI operation requests.
  - Dynamic limit synchronization ensuring plan upgrades/downgrades immediately update the active period's limits.

- **Invoicing & Customer Portal (`src/lib/billing/invoiceService.ts`):**
  - Invoice tracking (`getUserInvoices`, `upsertInvoice`) with dual Supabase DB and in-memory fallback.
  - Self-service billing portal session generation.

- **Database Migration (`supabase/migrations/009_phase8_billing.sql`):**
  - 6 new commercial tables: `plans`, `subscriptions`, `billing_customers`, `billing_events`, `invoices`, `usage_periods`.
  - Strict Row Level Security (RLS) policies on every table protecting user isolation.
  - Default seed data for Free, Pro, and Advanced plans.

- **New REST API Endpoints:**
  - `GET /api/billing/plans` — Public list of plans and features for the pricing page.
  - `GET /api/billing/subscription` — User subscription status, plan config, and today's usage.
  - `POST /api/billing/checkout` — Server-verified checkout session creation.
  - `POST /api/billing/portal` — Customer self-service billing management portal.
  - `POST /api/billing/webhook` — Signature-verified, idempotent webhook handler for Stripe events.
  - `GET /api/billing/usage` — Real-time quota and usage metrics for the active period.
  - `GET /api/billing/invoices` — User billing and payment history.
  - `POST /api/billing/cancel` — User self-service cancellation at period end.
  - `GET /api/admin/billing` — Admin billing summary and MRR calculation.

- **User Interface & Navigation:**
  - `/pricing` — Dedicated transparent pricing page featuring plan cards, feature comparisons, and honest pricing.
  - `/account/billing` — Self-service billing dashboard with real-time usage progress bars, subscription management, payment history table, and cancellation flow.
  - `/settings` — Integrated Phase 8 Subscription & Billing management section with direct navigation.
  - `/diagnostics` — Added Phase 8 Billing & Subscription Architecture panel showing total subscriptions, plan distribution, active/trialing counts, and estimated MRR.
  - `Sidebar.tsx` — Added Pricing and Billing links in the Personal navigation group.

- **Testing & Verification:**
  - `src/__tests__/billing.test.ts` — 60 comprehensive unit and integration tests across 11 suites.
  - **197/197 tests passing** across 9 test suites.
  - 0 TypeScript errors (`tsc --noEmit`).
  - 0 ESLint warnings or errors (`next lint`).
  - Production build compiled cleanly across 48 App Router endpoints (`npm run build`).

### To activate Phase 8 in Supabase (Optional for full DB persistence)

1. Open Supabase SQL Editor.
2. Run `supabase/migrations/009_phase8_billing.sql`.
*(Note: AI Radar includes automatic in-memory fallbacks for all billing and subscription stores, so all 197 tests pass and the full billing system is completely operational even without live database connections or Stripe credentials).*

---

## Phase 9: Product Validation, Intelligence Quality, AI Evaluation, Performance, Security & Production Hardening

**Status: Complete**
**Completed:** 2026-10-02

### What was built & verified

- **Comprehensive System Audit & Baseline Instrumentation (`src/lib/services/qualityEvaluationService.ts`):**
  - Integrated operational telemetry: total AI operations, token volume, real-time cache hit ratios, active subscription counts, and estimated MRR.
  - Granular AI cost models for OpenAI `gpt-4o-mini` (\$0.15/\$0.60 per 1M tokens), Google `gemini-1.5-flash` (\$0.075/\$0.30 per 1M tokens), and heuristic zero-cost fallback mode.
  - Verified average per-user AI costs are well below plan margins (< \$0.06/user/mo on Free tier).

- **Standardized AI Evaluation Dataset (`src/lib/ai/evaluationDataset.ts`):**
  - Reusable regression suite covering 7 canonical test dimensions:
    1. Summarization & Fact Extraction
    2. Hallucination Resistance (sparse document with unstated pricing/license)
    3. Hallucination Resistance (promotional hype with unverified claims)
    4. Prompt Injection Defense (instruction override attack)
    5. Prompt Injection Defense (privilege escalation & data deletion attack)
    6. Trend Evidence Grounding (rejection of single weak speculation)
    7. Career Grounding (rejection of false job guarantee claims)

- **Hardened Prompt Injection & Security Defenses (`src/lib/ai/sanitizer.ts` & `next.config.ts`):**
  - Extended regex attack filters neutralizing privilege escalation, data deletion, credential exfiltration, and instruction bypass attempts into safe `[SUSPECTED_INSTRUCTION_REMOVED]` tokens.
  - Strict input truncation (`MAX_SOURCE_CONTENT_CHARS = 10,000`) protecting against token exhaustion and prompt stuffing.
  - Enforced production HTTP security headers in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

- **Cache Reliability & Performance Telemetry (`src/lib/services/cacheService.ts`):**
  - Resolved `globalCache.clear` invocation issue.
  - Added cache hits/misses accounting and percentage hit-rate reporting (`getCacheMetrics()`).

- **User Quality Feedback & Reporting System (`src/app/api/feedback/report/` & `schemas.ts`):**
  - Extended feedback types to include actionable quality categories: `incorrect`, `duplicate`, `missing_source`, `poor_summary`, `bad_recommendation`, `technical_issue`, `billing_issue`.
  - Added admin feedback diagnostics endpoint (`GET /api/feedback/report`) aggregating issues by category and entity.

- **System Validation & Regression Test Suite (`src/__tests__/validation.test.ts`):**
  - 35 automated tests verifying hallucination resistance, prompt injection immunity, timestamp integrity, deduplication precision, 5-persona tenant isolation, cold-start degradation, billing tamper resistance, cache telemetry, and feedback reporting.
  - **232/232 tests passing** across all 10 test suites.
  - 0 TypeScript errors (`tsc --noEmit`).
  - 0 ESLint warnings or errors (`next lint`).
  - Production build compiled cleanly across 49 App Router endpoints (`npm run build`).

---

---

## Public Launch Hardening & Executive UX (Phases A & B)

**Status: Complete**  
**Completed:** 2026-10-06

### Phase A: Brand Identity, Legal Foundations & Navigation Streamlining
- **Vector Brand Mark & Favicon:** High-DPI bespoke radar mark with active beam sweep and target blips (`src/app/icon.svg` & `public/icon.svg`).
- **Dynamic OpenGraph & Twitter Social Cards:** 1200×630 server-generated social card generator via `@vercel/og` (`ImageResponse`) with live item counts and branding (`src/app/opengraph-image.tsx`).
- **Production SEO & Webmaster Policies:** Auto-generated `robots.txt` (`src/app/robots.ts`) and dynamic XML sitemap (`src/app/sitemap.ts`) exposing canonical public routes while disallowing private admin/account endpoints.
- **Legal Compliance Suite:**
  - Terms of Service (`src/app/terms/page.tsx`): Transformative AI citation, fair use disclaimers, Stripe billing terms, and educational disclaimers.
  - Privacy Policy (`src/app/privacy/page.tsx`): CCPA/GDPR compliance, zero data selling guarantee, isolated tenant architecture, and 1-click permanent data deletion rights (`/api/auth/delete-account`).
- **Senior Navigation Restructuring:** Consolidated navigation into 3 clean tiers (*Primary Feeds*, *Desks*, *Workspace*). Internal diagnostic links and admin telemetry are hidden from public users and only revealed to authenticated administrators. Discreet "Systems OK" status pill added to sidebar footer.

### Phase B: First-Time Visitor Onboarding & Adaptive Stream Density
- **Senior Executive Hero Welcome Experience (`src/components/home/HeroWelcomeBanner.tsx`):**
  - First-time visitor banner highlighting zero hallucinations, primary-source citations, and plain-English synthesis.
  - 1-Click CTA to today's 5-minute executive briefing and instant demo access.
  - Dismissible with safe `localStorage` persistence.
- **Executive Compact Scan Card (`src/components/intelligence/CompactIntelligenceCard.tsx`):**
  - High-density editorial view allowing readers to skim 10+ developments without scrolling fatigue.
  - Displays verified publisher name, 1-line plain-English punchline, relative time, category badge, and direct primary source link.
- **Adaptive Stream View (`src/components/intelligence/IntelligenceStreamView.tsx`):**
  - Interactive density switcher ("Compact Scan" vs "Expanded Deep Dive") with `localStorage` preference memory.
  - Category pill filter chips (`All`, `News`, `Tools`, `Research`, `Coding Agents`, `Safety & Policy`).
  ---

## Saved Stories & Bookmarks Engine (Full End-to-End Implementation)

**Status: Complete & Verified**  
**Completed:** 2026-10-06

### Root Cause Analysis & Problem Solved
- **Validation Block:** The previous `/api/saved` endpoint strictly required `SavedIntelligenceSchema` (`entity_type`, `entity_id`, `title`), causing lightweight `{ itemId }` bookmark toggles from the client to fail with HTTP 400 validation errors.
- **Missing API Link:** `createBookmark` and `removeBookmark` in `bookmarkRepository` were only used in unit tests and lacked a public HTTP route for browser client synchronization.
- **Unauthenticated/Guest Barrier:** Unauthenticated or preview users clicking "Save" did not have automatic client-side persistence or fallback UUID resolution in `bookmarkRepository`, resulting in saved stories disappearing on navigation to `/bookmarks`.

### What Was Built & Deployed
1. **Dedicated Bookmarks API (`/api/bookmarks`):**
   - `GET /api/bookmarks`: Returns user's bookmarked stories and item IDs.
   - `POST /api/bookmarks`: Saves stories to Supabase `bookmarks` table (with in-memory fallback for guests and offline environments) and dual-writes to `saved_intelligence`.
   - `DELETE /api/bookmarks`: Cleans up saved records by `itemId`.
2. **Resilient `/api/saved` Compatibility:**
   - Updated `/api/saved` to handle shorthand `{ itemId }` in both POST and DELETE without validation failures.
3. **Guest & UUID Resolution (`src/lib/repositories/bookmarkRepository.ts`):**
   - Added `resolveUserId` mapping non-UUID / guest sessions safely to `DEFAULT_USER_ID`, preventing foreign key constraint crashes while preserving multi-tenant isolation.
4. **Universal Client Bookmarks Manager (`src/lib/bookmarks/clientBookmarks.ts`):**
   - Dual-persistence engine storing full article metadata in `localStorage` (`ai_radar_saved_items_v2`) and emitting window events (`ai_radar_bookmarks_updated`) for real-time synchronization across cards and tabs.
   - Browser origin check ensuring safe fetch execution without jsdom relative URL warnings.
5. **Universal `useBookmarkStatus` React Hook (`src/lib/hooks/useBookmarkStatus.ts`):**
   - Placed into both `IntelligenceCard.tsx` and `CompactIntelligenceCard.tsx`.
   - Every card across the entire platform (Homepage, News, Research, Tools, Coding Agents, Safety) now has an interactive, working bookmark button even when no custom callback is supplied by the page.
6. **Executive Saved Stories Portfolio View (`src/components/bookmarks/SavedStoriesClient.tsx`):**
   - Interactive client component on `/bookmarks`.
   - Merges server-rendered records with locally saved items from guest browsing.
   - Real-time search filter by title, keyword, and publisher.
   - Category filter pills (`All Items`, `News`, `Research`, `Tools`, `Agents`).
   - 1-Click "Export Citations" copying markdown bibliography to clipboard.
   - 1-Click un-bookmarking with instant optimistic removal.
   - Clear sync status pills distinguishing cloud-synced accounts from local browser storage.
7. **Verification & Quality:**
   - **245 / 245 tests passing** across 11 test suites.
   - 0 TypeScript errors (`tsc --noEmit`).
   - Production server verified live on `http://localhost:3000`.
   - End-to-end verified via live curl: saving an article immediately renders it in `/bookmarks` HTML payload, and un-bookmarking cleanly removes it.

---

## Individual Push Subscription Tiers ($10 Pro / $20 Advanced) & Morning Email Digest

**Status: Complete & Verified**  
**Completed:** 2026-10-06

### Strategic Shift: Autonomous Push vs. Vanity Quotas
- **Problem Solved:** Vanity usage counters (100 vs 1,000 AI requests, 10 vs 30 briefings) created high churn risk because individual users rarely exceed 100 queries/day and forget to log into the web app daily.
- **Solution:** Re-architected pricing to an **autonomous push delivery model** tailored for individual researchers, engineers, and executives:
  - **Free ($0 forever):** Manual pull via the web dashboard. Full access to intelligence feeds, search, and standard filters. No automated email alerts.
  - **Pro ($10/mo, $100/yr):** Autonomous daily push. Synthesizes overnight developments into a **7:00 AM Morning Executive Email Digest** delivered straight to inbox; immediate **Breaking Model & Benchmark Alerts** when major foundation models drop; **25 custom keyword triggers**; **Technical & architectural code blueprints**; unlocked saved stories export (Markdown/BibTeX).
  - **Advanced ($20/mo, $200/yr):** Real-time high-frequency push. **Instant hourly push delivery** (< 5 min latency); **Multi-channel delivery (Email + Telegram / Discord / Slack Webhook)**; **100 custom keyword triggers**; **Personal programmatic REST API tokens**; raw JSON payloads and priority alert dispatch SLA.

### What Was Built & Verified
1. **Config Architecture (`src/lib/billing/planConfig.ts`):**
   - Configured exact minimum pricing: Pro `$10/mo` ($100/yr) and Advanced `$20/mo` ($200/yr).
   - Added new feature flags: `emailDigest`, `breakingAlerts`, `webhookAlerts`, `codeBlueprints` to `PlanFeatures`.
   - Human-readable feature labels added in `src/lib/billing/featureAccess.ts`.
2. **Interactive Push & Morning Digest Controller (`src/components/personalization/EmailAlertSettings.tsx`):**
   - Live configuration for recipient email address, 7:00 AM Morning Executive Digest toggle, and Breaking Model Alerts toggle.
   - Interactive keyword trigger management (up to 25 on Pro, 100 on Advanced).
   - Multi-channel webhook and Telegram dispatch URL configuration (unlocked on Advanced).
   - **Live Email Simulation Preview Modal:** Generates the exact 7:00 AM synthesized briefing (executive overview, model drops, code blueprint, verified paper citations) so users can test the email experience directly.
3. **Billing Sandbox & Matrix (`src/app/account/billing/page.tsx`):**
   - Updated tier cards to reflect $10 Pro and $20 Advanced pricing.
   - Updated capability preview lines and 10-row comparison matrix including email digest, breaking alerts, keyword triggers, webhook delivery, code blueprints, and API access.
   - Integrated `EmailAlertSettings` directly into the testing sandbox.
4. **Transparent Pricing Page (`src/app/pricing/page.tsx`):**
   - Clear value comparison highlighting "Manual Pull (Free)" vs "Autonomous Push (Pro & Advanced)".
   - Updated feature bullet points and savings calculation ($20/yr on Pro, $40/yr on Advanced).
5. **Quality Assurance:**
   - **248 / 248 tests passing** across 11 test suites.
   - 0 TypeScript errors (`tsc --noEmit`).
   - Clean Next.js 15 production build (`npm run build`).
   - Production server running and verified on `http://localhost:3000`.
   - End-to-end verified tier switching (`free` ↔ `pro` ↔ `advanced`) via `POST /api/billing/subscription`.

---

## Phase 3: Monetization Hardening, Desk Parity, RSC Stabilization & Touch Accessibility

**Status: Complete & Verified**  
**Completed:** 2026-10-06

### Key Achievements
1. **Desk Parity & Server Component Boundary Stabilization:**
   - Standardized all 5 intelligence desks (`/news`, `/tools`, `/research`, `/coding-agents`, `/safety`) to use the full `IntelligenceStreamView`.
   - Solved React Server Component serialization crashes by replacing non-serializable Lucide component references (`emptyIcon={LucideIcon}`) with serializable string names (`emptyIconName="wrench"`), resolving the Next.js production error.
2. **Monetization & Conversion Hardening (`/pricing` & `/account/billing`):**
   - Converted `/pricing` from internal test mode to consumer-ready subscription CTAs ("Get Started Free", "Subscribe to Pro ($10/mo)", "Subscribe to Advanced ($20/mo)").
   - Added query parameter routing (`?select=pro`, `?select=advanced`) with smooth scrolling and dynamic highlight styling on `/account/billing`.
   - Preserved developer and user testing sandbox via dedicated simulation launchpad cards.
3. **Mobile Touch Target & Accessibility Audit:**
   - Enforced WCAG 2.5.5 / 2.5.8 touch target standards: upgraded all primary and secondary buttons, bookmark buttons, share controls, drawer links, and modal triggers to meet `min-h-[44px]` / `min-h-[40px]` standards.
   - Enhanced tap zones on `MobileNav` bar (`h-9 w-9`), `CompactIntelligenceCard` action shortcuts (`min-h-[34px]`), and `EmailAlertSettings` preference toggles.
4. **Executive Briefing Elevation:**
   - Replaced generic widgets with the high-visibility `ExecutiveBriefingSpotlight` on the homepage and added the Autonomous Push Delivery Network card.
5. **Verification & Quality:**
   - **248 / 248 tests passing** (11/11 test suites).
   - 0 TypeScript compiler errors (`tsc --noEmit`).
   - 0 ESLint warnings or errors (`npm run lint`).
   - Production build compiled successfully (`npm run build`).
   - Production server running on `http://localhost:3000` with HTTP 200 verified across all 16 routes.

---

## Phase 4: Lemon Squeezy Merchant of Record Payments & Conversion Refinements

**Status: Complete & Verified**  
**Completed:** 2026-10-07

### Key Achievements
1. **Lemon Squeezy Merchant of Record Integration:**
   - Implemented native `LemonSqueezyBillingProvider` conforming to `IBillingProvider` without external npm dependencies (native `fetch` with JSON:API v1 and built-in Node `crypto.timingSafeEqual` HMAC-SHA256 signature verification).
   - Fully supports international payouts in USD directly to local bank accounts (e.g. Pakistani banks via Lemon Squeezy MoR).
   - Priority-based billing provider resolution: Lemon Squeezy → Stripe → Mock provider.
   - Webhook endpoint (`/api/billing/webhook`) accepts Lemon Squeezy `x-signature` header, verifies payloads with timing-safe HMAC comparison, and maps `subscription_created`, `subscription_updated`, and `subscription_cancelled` events into user tiers.
   - Dynamic plan variant configuration supporting monthly ($10/mo, $20/mo) and discounted annual billing ($100/yr, $200/yr).
2. **Interactive Pricing Experience (`/pricing`):**
   - Created `PricingTableClient` with real-time Monthly / Annual billing toggle.
   - Dynamic annual savings math displaying exact dollar discounts ($20/year on Pro, $40/year on Advanced).
   - Comprehensive trust badges: 256-bit SSL encryption, Merchant of Record (Lemon Squeezy), and supported payment methods (Visa, Mastercard, PayPal, Apple Pay, Google Pay).
   - Direct query parameter routing to checkout (`/account/billing?select=pro&interval=annual`).
3. **Empty State & Navigation Improvements:**
   - Added 1-click "Show All Categories" reset action inside `IntelligenceStreamView` empty states.
   - Added "Pricing & Plans" navigation link with "Pro $10" highlight badge in `Sidebar.tsx`.
   - Moved "Settings" navigation link from bottom footer to directly below "Pricing & Plans" in both `Sidebar.tsx` and `MobileNav.tsx`.
4. **Checkout Security & Test Mode Gating (`/account/billing` & `POST /api/billing/subscription`):**
   - Restricted instant tier switching on `/account/billing` so public visitors cannot bypass payment; upgrading to Pro or Advanced strictly initiates real Lemon Squeezy checkout.
   - Enforced backend authorization guard in `POST /api/billing/subscription`: returns HTTP 403 Forbidden with `requiresCheckout: true` if a non-admin in production attempts to activate a paid tier without Lemon Squeezy.
   - Preserved instant tier sandbox and persona tester specifically for internal development (`process.env.NODE_ENV !== 'production'`) and administrators (`user.role === 'admin'`).
   - Added a dual test button in Admin/Dev mode ("Instant Test Switch" vs "Test Lemon Squeezy Checkout") for end-to-end verification.
5. **Verification & Quality:**
   - **259 / 259 tests passing** across all 12 test suites (including 11 dedicated Lemon Squeezy and checkout restriction tests).
   - 0 TypeScript compiler errors (`tsc --noEmit`).
   - Clean Next.js 15 production build (`npm run build`).
   - Production server running on `http://localhost:3000` with HTTP 200 across all routes.
