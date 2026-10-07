# AI Radar

A personal AI intelligence platform that helps you stay informed about important developments across artificial intelligence — and turn that information into practical learning, career, research, project, and business opportunities.

> **Phase 7 — Commercial Product Foundation, Multi-User Architecture & Onboarding Complete.** Complete multi-user isolation, Supabase Auth session management, interactive 7-step onboarding flow, Free plan limits with sliding-window rate limiting, AI usage and cost telemetry, global ⌘K cross-entity search, and cascading account deletion. Verified across 137 tests with 3 distinct realistic personas.

---

## What AI Radar does

AI Radar is designed to answer:

- What has happened recently in AI?
- Which models, tools, research papers, and coding agents are worth knowing about?
- What capabilities are improving, and what evidence supports that?
- Which emerging trends deserve further investigation?
- What should I learn, test, or build next to improve my AI/ML career?
- What real customer problems or business opportunities could AI help solve?
- What safety, security, privacy, legal, and regulatory developments should I know about?

---

## Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui tokens & custom accessible components |
| Database | Supabase PostgreSQL |
| Auth & RLS | Supabase Auth + PostgreSQL Row Level Security |
| Validation | Zod |
| Testing | Vitest + Testing Library |
| Package manager | npm |

---

## Local development

### Prerequisites

- Node.js 18+ (tested on Node v26.5 via nvm)
- npm 9+

### Setup

```bash
# Navigate to the project directory
cd "AI Radar"

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking (tsc --noEmit)
npm test             # Run Vitest test suite
npm run test:watch   # Run Vitest in watch mode
```

---

## Database setup (Supabase)

AI Radar works out of the box in an unconfigured state, showing honest empty and configuration-pending states. When you are ready to connect a real database:

1. **Create a Supabase Project:**
   - Sign up or log in at [supabase.com](https://supabase.com).
   - Create a new project (e.g., `ai-radar`).

2. **Run Database Migrations:**
   - In your Supabase Dashboard, open the **SQL Editor**.
   - Copy and run the contents of [`supabase/migrations/001_core_schema.sql`](supabase/migrations/001_core_schema.sql) (creates tables, constraints, indexes, and default categories).
   - Copy and run the contents of [`supabase/migrations/002_row_level_security.sql`](supabase/migrations/002_row_level_security.sql) (enables RLS and user isolation).
   - *(Optional for development)* Run [`supabase/migrations/003_dev_seed.sql`](supabase/migrations/003_dev_seed.sql) to populate clearly labeled `[DEV]` example records.

3. **Configure Environment Variables:**
   - Go to **Project Settings → API** in Supabase.
   - Copy your credentials into `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```
   - Restart your Next.js server (`npm run dev`). The Diagnostics and Dashboard status indicators will immediately switch to **Connected**!

---

## Database architecture & entities

The schema enforces strict separation between **original source data** and **AI-generated interpretation**:

| Entity | Description | RLS Policy |
|---|---|---|
| `profiles` | User profiles linked to `auth.users` | Owner read/update |
| `sources` | Configured intelligence sources with type and manual trust level | Read authenticated, write server-only |
| `items` | Original records from primary sources with canonical URL & content hash | Read authenticated, write server-only |
| `categories` | Canonical categories with stable slugs and UI display labels | Public read |
| `item_categories` | Many-to-many relationship between items and categories | Read authenticated |
| `summaries` | AI-generated analysis, key points, claims, and confidence scores | Read authenticated, write server-only |
| `bookmarks` | User-saved items with unique constraint on `(user_id, item_id)` | Strict user ownership isolation |
| `collection_runs` | Logs of collection jobs with record counts, durations, and safe errors | Read authenticated |

### Deduplication strategy
Items are protected against duplication at multiple levels:
1. `(source_id, external_id)` unique constraint for sources with stable external IDs.
2. `canonical_url` unique index across all sources.
3. Deterministic SHA-256 `content_hash` over normalized URL, title, and description.

---

## Project structure

```
src/
  app/                         # Next.js App Router pages and layouts
    layout.tsx                 # Root layout — sidebar + mobile nav
    page.tsx                   # Dashboard (live DB stats & recent items)
    globals.css                # Global styles and CSS design tokens
    loading.tsx                # Global loading state
    error.tsx                  # Global error boundary
    news/page.tsx              # AI News (querying category 'ai-news')
    tools/page.tsx             # AI Tools
    research/page.tsx          # Models & Research (querying category 'models')
    coding-agents/page.tsx     # Coding Agents
    trends/page.tsx            # Emerging Trends (interactive filters & discovery)
    trends/[slug]/page.tsx     # Trend Detail (timelines & evidence citations)
    briefing/page.tsx          # Daily Intelligence Briefing (archived dates & citations)
    career/page.tsx            # Career & Projects
    business/page.tsx          # Business Opportunities
    safety/page.tsx            # Safety & Regulation
    bookmarks/page.tsx         # Bookmarks (user-scoped RLS queries)
    settings/page.tsx          # Settings & Topic Preferences profile
    diagnostics/page.tsx       # Diagnostics (live health checks & record counts)
    api/
      trends/route.ts          # Trends retrieval and discovery endpoint
      briefing/route.ts        # Daily briefing retrieval and generation endpoint
      preferences/route.ts     # User topic preferences endpoint
      enrich/route.ts          # AI enrichment execution endpoint
      collect/route.ts         # Source collection pipeline endpoint
  components/
    layout/                    # Sidebar, MobileNav, TopHeader, PageContainer
    intelligence/              # TrendCard, TrendBadge, BriefingView, TopicPreferencesEditor, etc.
  lib/
    database.types.ts          # Type-safe PostgreSQL schema definitions
    intelligence/              # Phase 5 Intelligence Engine
      signals.ts               # Multi-source signal detection & contradiction alerts
      lifecycle.ts             # Deterministic lifecycle rules & confidence formula
      importance.ts            # Transparent importance scoring & novelty ranking
      preferences.ts           # Topic preferences model & computeUserRelevance()
      trendDiscovery.ts        # Trend candidate clustering & evidence mapping
      briefingService.ts       # Daily intelligence briefing generation
    ai/                        # Phase 4 AI Enrichment & Provider Adapters
    repositories/
      trendRepository.ts       # Trends & evidence data access with fallback
      briefingRepository.ts    # Daily briefings data access with fallback
      itemRepository.ts        # Items data access & deduplication
      sourceRepository.ts      # Sources data access
      categoryRepository.ts    # Categories data access
      summaryRepository.ts     # AI summaries data access
      personalizationRepository.ts # User profile, career signals, skill gaps, projects
    personalization/           # Phase 6 Personal Intelligence Layer
      personalRelevance.ts     # Explainable relevance scoring (0–100) & negative filters
      skillDemandEngine.ts     # Skill mentions & source diversity aggregator
      skillGapEngine.ts        # Gap detection & 3-step actionable learning paths
      careerSignalsEngine.ts   # Macro architectural & role shifts
      projectOpportunityEngine.ts # "What Could I Build?" project ideas
      learningIntelligence.ts  # Concept learning blueprints & milestone projects
      personalBriefingService.ts # Personalized briefing extension
      feedbackService.ts       # Dismissals, saves, and feedback handling
    billing/                   # Phase 8 Commercialization & Subscriptions
      planConfig.ts            # Central, configurable plan limits & features
      billingProvider.ts       # Provider-agnostic payment abstraction (IBillingProvider)
      stripeProvider.ts        # Stripe checkout, portal, and webhook handling
      mockProvider.ts          # Deterministic in-memory mock billing provider
      subscriptionService.ts   # Lifecycle state machine & audit event logging
      featureAccess.ts         # Server-side feature gating
      usageEnforcement.ts      # Atomic daily usage quotas
      invoiceService.ts        # Payment invoice tracking & history
  __tests__/                   # 197 tests passing across 9 test suites
supabase/
  migrations/
    001_core_schema.sql        # Tables, constraints, indexes, triggers
    002_row_level_security.sql # Row Level Security policies
    003_dev_seed.sql           # Development seed data ([DEV] records only)
    004_phase3_sources.sql     # Real sources seed (arXiv, Hugging Face, GitHub)
    005_phase4_enrichment.sql  # Summary columns for deep AI enrichment
    006_phase5_intelligence.sql# Intelligence layer tables (trends, briefings, preferences)
    007_phase6_personal_intelligence.sql # Personal intelligence tables (profiles, signals, gaps, projects, feedback)
    008_phase7_multi_user.sql  # Multi-user SaaS foundation (plans, telemetry, topics, saved, analytics, RLS)
    009_phase8_billing.sql     # Commercial billing, subscriptions, invoices, audit events, RLS
```

---

## Security notes

- **No Secrets in Client Code:** Client-side code only accesses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server-Only Service Role:** `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side repositories.
- **Credential Redaction:** The safe logger automatically redacts passwords, tokens, API keys, and Bearer authorization headers.
- **Untrusted External Data:** Source data is stored as plain content records — never executed as code or instructions.

---

## Roadmap

See [`STATUS.md`](STATUS.md) for the current implementation status and planned phase details.
