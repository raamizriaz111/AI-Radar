-- =============================================================================
-- AI Radar — Phase 8 Migration: Billing, Subscriptions & Commercialization
-- =============================================================================
-- Adds tables for:
--   1. plans              - Configurable plan definitions (FREE/PRO/ADVANCED)
--   2. subscriptions      - Per-user subscription records with lifecycle states
--   3. billing_customers  - Payment provider customer mapping
--   4. billing_events     - Commercial audit trail (idempotent, replay-safe)
--   5. invoices           - Invoice/payment history per user
--   6. usage_periods      - Billing period usage snapshots for enforcement
-- Extends: user_plans (adds provider fields for subscription linkage)
-- Row Level Security: All billing tables are user-isolated
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: plans — Central plan configuration (not per-user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   TEXT UNIQUE NOT NULL,   -- 'free' | 'pro' | 'advanced'
  display_name           TEXT NOT NULL,
  description            TEXT,
  price_monthly_usd      NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  price_annual_usd       NUMERIC(8, 2),
  -- Usage limits (all configurable, never hard-coded)
  ai_requests_limit      INT NOT NULL DEFAULT 100,
  briefings_limit        INT NOT NULL DEFAULT 10,
  tracked_topics_limit   INT NOT NULL DEFAULT 20,
  items_per_page_limit   INT NOT NULL DEFAULT 20,
  -- Feature flags (JSONB for extensibility)
  features               JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Provider price IDs (set when payment provider is configured)
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual  TEXT,
  -- Ordering and visibility
  sort_order             INT NOT NULL DEFAULT 0,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  is_publicly_visible    BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS plans_slug_idx ON public.plans (slug);
CREATE INDEX IF NOT EXISTS plans_active_idx ON public.plans (is_active, sort_order);

COMMENT ON TABLE public.plans IS
  'Configurable plan definitions. All limits and features are stored here — never hard-coded in application logic.';

-- Seed canonical plan records
INSERT INTO public.plans (slug, display_name, description, price_monthly_usd, price_annual_usd, ai_requests_limit, briefings_limit, tracked_topics_limit, items_per_page_limit, features, sort_order) VALUES
(
  'free',
  'Free',
  'Full access to AI intelligence with generous daily limits. No credit card required.',
  0.00,
  0.00,
  100,
  10,
  20,
  20,
  '{"custom_topics": true, "export": false, "early_trends": true, "advanced_filters": false, "api_access": false, "priority_support": false}'::jsonb,
  0
),
(
  'pro',
  'Pro',
  'Higher limits, export, early trend signals, and advanced filters for power users.',
  19.00,
  190.00,
  1000,
  30,
  100,
  50,
  '{"custom_topics": true, "export": true, "early_trends": true, "advanced_filters": true, "api_access": false, "priority_support": false}'::jsonb,
  1
),
(
  'advanced',
  'Advanced',
  'Maximum limits, API access, and priority support for teams and professionals.',
  49.00,
  490.00,
  10000,
  100,
  500,
  100,
  '{"custom_topics": true, "export": true, "early_trends": true, "advanced_filters": true, "api_access": true, "priority_support": true}'::jsonb,
  2
)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Table: subscriptions — Per-user subscription lifecycle
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID UNIQUE NOT NULL,
  plan_slug               TEXT NOT NULL REFERENCES public.plans(slug) ON UPDATE CASCADE,
  status                  TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired', 'paused', 'incomplete')),
  -- Billing period
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  -- Trial period
  trial_start             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  -- Cancellation
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  canceled_at             TIMESTAMPTZ,
  -- Billing interval
  billing_interval        TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual', 'none')),
  -- Provider reference (nullable — not all plans require payment)
  provider                TEXT,                           -- 'stripe' | 'manual' | null
  provider_subscription_id TEXT,                          -- e.g. 'sub_xxx'
  -- Metadata
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS subscriptions_provider_sub_idx ON public.subscriptions (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

COMMENT ON TABLE public.subscriptions IS
  'Per-user subscription records. Stores lifecycle state, billing period, trial, and payment provider references.';

-- Default FREE subscriptions for existing users (idempotent, safe if user_plans exists)
DO $$
BEGIN
  IF to_regclass('public.user_plans') IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_slug, status, billing_interval)
    SELECT up.user_id, 'free', 'active', 'none'
    FROM public.user_plans up
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subscriptions s WHERE s.user_id = up.user_id
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Table: billing_customers — Provider customer mapping
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL,
  provider            TEXT NOT NULL DEFAULT 'stripe',
  provider_customer_id TEXT NOT NULL,              -- e.g. 'cus_xxx'
  email               TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_customers_provider_cust_idx
  ON public.billing_customers (provider, provider_customer_id);
CREATE INDEX IF NOT EXISTS billing_customers_user_idx ON public.billing_customers (user_id);

COMMENT ON TABLE public.billing_customers IS
  'Maps internal user IDs to payment provider customer IDs. One record per provider per user.';

-- -----------------------------------------------------------------------------
-- 4. Table: billing_events — Immutable commercial audit trail
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID,
  event_type        TEXT NOT NULL,                  -- 'subscription.created' | 'payment.succeeded' | etc.
  provider          TEXT,
  provider_event_id TEXT,                           -- Idempotency key (e.g. Stripe event ID)
  subscription_id   UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_usd        NUMERIC(10, 2),
  currency          TEXT DEFAULT 'usd',
  status            TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
  raw_payload       JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Original webhook payload (for reconciliation)
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_idx
  ON public.billing_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;             -- Replay protection
CREATE INDEX IF NOT EXISTS billing_events_user_idx ON public.billing_events (user_id);
CREATE INDEX IF NOT EXISTS billing_events_type_idx ON public.billing_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_events_subscription_idx ON public.billing_events (subscription_id);

COMMENT ON TABLE public.billing_events IS
  'Immutable audit trail of all billing lifecycle events. Idempotent on (provider, provider_event_id). Never deleted.';

-- -----------------------------------------------------------------------------
-- 5. Table: invoices — Payment history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  subscription_id       UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL DEFAULT 'stripe',
  provider_invoice_id   TEXT UNIQUE,               -- e.g. 'in_xxx'
  amount_due_usd        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  amount_paid_usd       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency              TEXT NOT NULL DEFAULT 'usd',
  status                TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_url           TEXT,
  period_start          TIMESTAMPTZ,
  period_end            TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoices_user_idx ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_subscription_idx ON public.invoices (subscription_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices (status);

COMMENT ON TABLE public.invoices IS
  'Payment invoice history. Linked to subscriptions. Mirrors provider invoice state for local reporting.';

-- -----------------------------------------------------------------------------
-- 6. Table: usage_periods — Billing period usage snapshots
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_periods (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  ai_requests_used    INT NOT NULL DEFAULT 0,
  briefings_used      INT NOT NULL DEFAULT 0,
  ai_requests_limit   INT NOT NULL DEFAULT 100,
  briefings_limit     INT NOT NULL DEFAULT 10,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usage_period_unique UNIQUE (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS usage_periods_user_idx ON public.usage_periods (user_id, period_start DESC);

COMMENT ON TABLE public.usage_periods IS
  'Billing period usage snapshots for limit enforcement and usage dashboards.';

-- -----------------------------------------------------------------------------
-- 7. Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_periods ENABLE ROW LEVEL SECURITY;

-- Plans: publicly readable (pricing page), no user write access
DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all" ON public.plans
  FOR SELECT USING (is_active = true AND is_publicly_visible = true);

-- Subscriptions: users read own, service role writes
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Billing customers: users read own
DROP POLICY IF EXISTS "billing_customers_select_own" ON public.billing_customers;
CREATE POLICY "billing_customers_select_own" ON public.billing_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Billing events: users read own (audit transparency)
DROP POLICY IF EXISTS "billing_events_select_own" ON public.billing_events;
CREATE POLICY "billing_events_select_own" ON public.billing_events
  FOR SELECT USING (auth.uid() = user_id);

-- Invoices: users read own
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Usage periods: users read own
DROP POLICY IF EXISTS "usage_periods_select_own" ON public.usage_periods;
CREATE POLICY "usage_periods_select_own" ON public.usage_periods
  FOR SELECT USING (auth.uid() = user_id);
