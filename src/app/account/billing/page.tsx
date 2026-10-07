'use client';

// =============================================================================
// AI Radar — Account Billing & Interactive Tier Testing Sandbox
// =============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Zap,
  TrendingUp,
  ArrowUp,
  Check,
  X,
  Lock,
  Unlock,
  Sparkles,
  Star,
  Building2,
  Shield,
  ArrowRight,
  FlaskConical,
  Download,
  SlidersHorizontal,
  Key,
  RefreshCw,
  Tag,
  BookOpen,
  Mail,
  Bell,
  Webhook,
  Code,
  Clock,
  Copy,
  Terminal,
  Play,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { StatusIndicator } from '@/components/intelligence/StatusIndicator';
import { EmailAlertSettings } from '@/components/personalization/EmailAlertSettings';
import { cn } from '@/lib/utils';

interface PlanInfo {
  slug: string;
  displayName: string;
  priceMonthlyUsd: number;
  description: string;
  limits: {
    aiRequestsLimit: number;
    briefingsLimit: number;
    trackedTopicsLimit: number;
    itemsPerPageLimit: number;
  };
  features: {
    customTopics: boolean;
    export: boolean;
    earlyTrends: boolean;
    advancedFilters: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    emailDigest?: boolean;
    breakingAlerts?: boolean;
    webhookAlerts?: boolean;
    codeBlueprints?: boolean;
  };
}

interface SubscriptionInfo {
  planSlug: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  billingInterval: string;
  provider?: string | null;
  metadata?: Record<string, any>;
}

interface UsagePeriodInfo {
  aiRequestsUsed: number;
  briefingsUsed: number;
  aiRequestsLimit: number;
  briefingsLimit: number;
  periodEnd: string;
}

interface InvoiceInfo {
  id: string;
  amountPaidUsd: number;
  status: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  invoiceUrl: string | null;
}

const TIER_META = {
  free: {
    icon: Zap,
    badge: 'Standard Access',
    color: 'emerald',
    tagline: 'Standard manual access via web dashboard. No automated email alerts.',
    price: '$0',
    frequency: 'forever',
  },
  pro: {
    icon: Star,
    badge: 'Most Popular',
    color: 'blue',
    tagline: 'Daily 7:00 AM executive email digest, breaking model alerts & keyword triggers.',
    price: '$10',
    frequency: '/month',
  },
  advanced: {
    icon: Building2,
    badge: 'Power & Webhook',
    color: 'purple',
    tagline: 'Instant real-time email + Webhook alerts, code blueprints & programmatic REST API.',
    price: '$20',
    frequency: '/month',
  },
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriodInfo | null>(null);
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [switchingTier, setSwitchingTier] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [selectedTierFromQuery, setSelectedTierFromQuery] = useState<'free' | 'pro' | 'advanced' | null>(null);
  const [showApiToken, setShowApiToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any | null>(null);
  const [canUseTestMode, setCanUseTestMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // Promo Coupon Engine State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    planSlug: 'pro' | 'advanced';
    discountPercent: number;
    displayName: string;
    description: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const mockApiToken = 'airadar_live_sec_8f93a1c09e4d678b209e73';

  async function handleApplyPromo(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanCode = promoCodeInput.trim();
    if (!cleanCode) return;

    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/billing/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.valid && data.coupon) {
        setAppliedPromo(data.coupon);
        setPromoError(null);
        setSelectedTierFromQuery(data.coupon.planSlug);
        setTimeout(() => {
          const targetEl = document.getElementById(`tier-card-${data.coupon.planSlug}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      } else {
        setAppliedPromo(null);
        setPromoError(data.error || 'Invalid code');
      }
    } catch {
      setAppliedPromo(null);
      setPromoError('Invalid code');
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleTestApi() {
    setApiTestLoading(true);
    try {
      const res = await fetch('/api/search?q=agents&limit=3');
      const data = await res.json();
      setApiTestResult(data);
    } catch (err: any) {
      setApiTestResult({ ok: false, error: err?.message || 'Network request failed' });
    } finally {
      setApiTestLoading(false);
    }
  }

  async function handleCopyToken() {
    try {
      await navigator.clipboard.writeText(mockApiToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {}
  }

  async function handleCopyCurl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const curlCmd = `curl -s "${origin}/api/search?q=agents" -H "Authorization: Bearer ${mockApiToken}"`;
    try {
      await navigator.clipboard.writeText(curlCmd);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch {}
  }

  useEffect(() => {
    fetchBillingData();

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const select = searchParams.get('select') as 'free' | 'pro' | 'advanced' | null;
      if (select && ['free', 'pro', 'advanced'].includes(select)) {
        setSelectedTierFromQuery(select);
        setTimeout(() => {
          const targetEl = document.getElementById(`tier-card-${select}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);
      }
    }
  }, []);

  async function fetchBillingData() {
    try {
      setLoading(true);
      const [subRes, invRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/invoices'),
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        setPlan(data.plan);
        setSubscription(data.subscription);
        setUsagePeriod(data.usagePeriod);
        setCanUseTestMode(Boolean(data.canUseTestMode));
        setIsAdmin(Boolean(data.isAdmin));
        setIsDev(Boolean(data.isDev));
        setIsGuest(Boolean(data.isGuest));
      }

      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices ?? []);
      }
    } catch {
      setError('Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitchTier(newPlanSlug: 'free' | 'pro' | 'advanced', options?: { forceCheckout?: boolean }) {
    try {
      setSwitchingTier(newPlanSlug);
      setError(null);

      // Free tier or downgrades update immediately
      if (newPlanSlug === 'free') {
        const res = await fetch('/api/billing/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planSlug: newPlanSlug, billingInterval: 'monthly' }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setPlan(data.plan);
          setSubscription(data.subscription);
          setUsagePeriod(data.usagePeriod);
          setSuccessMessage(`Switched active tier to ${data.plan.displayName}.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setError(data.error || 'Failed to switch tier.');
        }
        return;
      }

      // If a valid promo coupon is applied for this tier: activate instantly with full discount
      if (appliedPromo && appliedPromo.planSlug === newPlanSlug && !options?.forceCheckout) {
        const res = await fetch('/api/billing/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: newPlanSlug,
            billingInterval: 'monthly',
            promoCode: appliedPromo.code,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setPlan(data.plan);
          setSubscription(data.subscription);
          setUsagePeriod(data.usagePeriod);
          setSuccessMessage(`🎉 Promo applied (${appliedPromo.code})! Switched active tier to ${data.plan.displayName} with 100% discount.`);
          setAppliedPromo(null);
          setPromoCodeInput('');
          setTimeout(() => setSuccessMessage(null), 5000);
          return;
        } else {
          setError(data.error || 'Failed to activate tier with promo code.');
          return;
        }
      }

      // If user is a public visitor (not in test mode) OR forceCheckout is explicitly requested:
      // They must proceed through real Lemon Squeezy checkout.
      if (!canUseTestMode || options?.forceCheckout) {
        if (isGuest) {
          window.location.href = `/login?redirect=${encodeURIComponent(`/account/billing?select=${newPlanSlug}`)}`;
          return;
        }

        const checkoutRes = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: newPlanSlug,
            billingInterval: 'monthly',
            promoCode: appliedPromo?.planSlug === newPlanSlug ? appliedPromo.code : undefined,
          }),
        });
        const checkoutData = await checkoutRes.json();

        if (checkoutRes.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(`/account/billing?select=${newPlanSlug}`)}`;
          return;
        }

        if (checkoutRes.ok && checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }

        setError(checkoutData.error || 'Failed to initialize Lemon Squeezy checkout.');
        return;
      }

      // Development or Admin test mode: Instant switch without checkout
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: newPlanSlug,
          billingInterval: 'monthly',
          promoCode: appliedPromo?.planSlug === newPlanSlug ? appliedPromo.code : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPlan(data.plan);
        setSubscription(data.subscription);
        setUsagePeriod(data.usagePeriod);
        setSuccessMessage(`[Test Mode Active] Switched active tier to ${data.plan.displayName}. You can now test its limits and unlocked features.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(data.error || 'Failed to switch tier.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with billing server.');
    } finally {
      setSwitchingTier(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You\'ll keep access until the end of your billing period.')) return;

    setCancelLoading(true);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCancelMessage(data.message);
        fetchBillingData();
      } else {
        setError(data.error ?? 'Failed to cancel subscription.');
      }
    } catch {
      setError('Failed to cancel subscription.');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.portalUrl) {
        window.open(data.portalUrl, '_blank');
      }
    } catch {
      setError('Failed to open billing portal.');
    }
  }

  function usagePct(used: number, limit: number): number {
    return Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  }

  const currentSlug = plan?.slug || 'free';

  return (
    <>
      <TopHeader
        title={canUseTestMode ? "Billing & Plan Testing Sandbox" : "Billing & Subscription Plans"}
        description={
          canUseTestMode
            ? "Developer & Admin Test Mode: Instant tier testing active. Switch freely to preview live capability differences."
            : "Manage your subscription, quotas, automated alerts, and billing history."
        }
      />
      <PageContainer narrow>
        {loading ? (
          <div className="rounded-xl border border-white/[0.08] bg-card p-12 text-center backdrop-blur-md">
            <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Loading billing and tier configuration…</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feedback Banners */}
            {successMessage && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between gap-3 text-xs text-red-300">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}

            {cancelMessage && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-2 text-xs text-amber-300">
                <CheckCircle2 size={16} className="text-amber-400 flex-shrink-0" />
                <span>{cancelMessage}</span>
              </div>
            )}

            {/* Arrived from Pricing banner */}
            {selectedTierFromQuery && selectedTierFromQuery !== currentSlug && (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex items-center justify-between gap-3 text-xs text-primary animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-primary flex-shrink-0 animate-pulse" />
                  <span>
                    You selected the <strong className="capitalize">{selectedTierFromQuery}</strong> tier ({TIER_META[selectedTierFromQuery].price}/mo) from Pricing. Click <strong>{canUseTestMode ? `Activate ${selectedTierFromQuery.toUpperCase()} Test Mode` : `Upgrade to ${selectedTierFromQuery.toUpperCase()}`}</strong> below to proceed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTierFromQuery(null)}
                  className="text-primary hover:text-foreground p-1 rounded-md"
                  aria-label="Dismiss selection notice"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Direct Persona Tester (Restricted to Development / Admin Mode) */}
            {canUseTestMode && (
              <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-primary" />
                      <h3 className="text-xs font-bold text-foreground">
                        {isAdmin ? 'Admin Persona Tester' : 'Developer Sandbox Persona Tester'}
                      </h3>
                      <span className="rounded bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                        Test Mode Active
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Bypass payment in {isAdmin ? 'admin' : 'development'} mode to test Free vs Advanced limits, digests, and blueprints. Public visitors must pay through Lemon Squeezy.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSwitchTier('free')}
                      disabled={switchingTier === 'free'}
                      className={cn(
                        'flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm',
                        currentSlug === 'free'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/50'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-white/[0.08]'
                      )}
                    >
                      <Zap size={13} className={currentSlug === 'free' ? 'text-emerald-400' : ''} />
                      <span>Test as Free</span>
                      {currentSlug === 'free' && <Check size={12} className="text-emerald-400 ml-1" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchTier('advanced')}
                      disabled={switchingTier === 'advanced'}
                      className={cn(
                        'flex min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm',
                        currentSlug === 'advanced'
                          ? 'bg-purple-600 text-white border border-purple-400 ring-2 ring-purple-500/40 shadow-purple-600/30'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-white/[0.08]'
                      )}
                    >
                      <Building2 size={13} className={currentSlug === 'advanced' ? 'text-white' : ''} />
                      <span>Test as Advanced ($20)</span>
                      {currentSlug === 'advanced' && <Check size={12} className="text-white ml-1" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: Subscription Plans & Upgrades */}
            <div className="rounded-2xl border border-white/[0.1] bg-card/80 p-5 md:p-6 backdrop-blur-md shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    {canUseTestMode ? (
                      <>
                        <Sparkles size={16} className="text-primary animate-pulse-dot" />
                        <h2 className="text-base font-bold text-foreground">Interactive Tier Sandbox</h2>
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary uppercase">
                          {isAdmin ? 'Admin Test Mode' : 'Dev Test Mode'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} className="text-primary" />
                        <h2 className="text-base font-bold text-foreground">Available Subscription Plans</h2>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                          Lemon Squeezy Checkout
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canUseTestMode
                      ? 'Instant testing active: Click any plan below to toggle account privileges, or test the hosted checkout flow.'
                      : 'Choose the plan tailored to your workflow. Secure checkout and automatic tax compliance powered by Lemon Squeezy.'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5 text-xs text-foreground/80 font-mono">
                  <span>Current:</span>
                  <span className="font-bold text-primary uppercase">{plan?.displayName || 'Free'}</span>
                </div>
              </div>

              {/* 3 Tier Cards */}
              <div className="grid gap-3.5 sm:grid-cols-3">
                {(['free', 'pro', 'advanced'] as const).map((slug) => {
                  const meta = TIER_META[slug];
                  const Icon = meta.icon;
                  const isActive = currentSlug === slug;
                  const isSwitching = switchingTier === slug;
                  const isSelectedFromQuery = selectedTierFromQuery === slug;

                  return (
                    <div
                      key={slug}
                      id={`tier-card-${slug}`}
                      className={cn(
                        'relative rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 scroll-mt-10',
                        isSelectedFromQuery && !isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        isActive
                          ? slug === 'pro'
                            ? 'border-blue-500/60 bg-blue-500/[0.08] shadow-lg shadow-blue-500/10'
                            : slug === 'advanced'
                            ? 'border-purple-500/60 bg-purple-500/[0.08] shadow-lg shadow-purple-500/10'
                            : 'border-emerald-500/60 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10'
                          : 'border-white/[0.08] bg-card/50 hover:border-white/20 hover:bg-card/90'
                      )}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg',
                            slug === 'pro'
                              ? 'bg-blue-500/20 text-blue-400'
                              : slug === 'advanced'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          )}>
                            <Icon size={14} />
                          </div>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          ) : isSelectedFromQuery ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary animate-pulse">
                              <Sparkles size={10} /> Selected Plan
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              {meta.badge}
                            </span>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="mb-2">
                          <h3 className="text-sm font-bold text-foreground capitalize">{slug} Tier</h3>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-extrabold text-foreground">{meta.price}</span>
                            <span className="text-[10px] text-muted-foreground">{meta.frequency}</span>
                          </div>
                        </div>

                        {/* Summary description */}
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                          {meta.tagline}
                        </p>

                        {/* Key limits preview */}
                        <div className="space-y-1.5 py-2.5 mb-3 border-y border-white/[0.06] text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Morning Digest:</span>
                            <span className="font-semibold font-mono">
                              {slug === 'free' ? (
                                <span className="text-muted-foreground/50">None</span>
                              ) : slug === 'pro' ? (
                                <span className="text-blue-400">7:00 AM Email</span>
                              ) : (
                                <span className="text-purple-400">Hourly / Instant</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Breaking Alerts:</span>
                            <span className="font-semibold font-mono">
                              {slug === 'free' ? (
                                <span className="text-muted-foreground/50">None</span>
                              ) : slug === 'pro' ? (
                                <span className="text-blue-400">Email Alerts</span>
                              ) : (
                                <span className="text-purple-400">Instant + Webhook</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Keyword Triggers:</span>
                            <span className="font-semibold text-foreground font-mono">
                              {slug === 'free' ? '0' : slug === 'pro' ? '25 Keywords' : '100 Keywords'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Delivery Channel:</span>
                            <span className="font-semibold font-mono">
                              {slug === 'free' ? 'Web App' : slug === 'pro' ? 'Email Inbox' : 'Email + Webhook'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Data Export:</span>
                            <span className="font-semibold font-mono">
                              {slug === 'free' ? (
                                <span className="text-muted-foreground/50">Locked</span>
                              ) : (
                                <span className="text-emerald-400">Unlocked</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">REST API:</span>
                            <span className="font-semibold font-mono">
                              {slug === 'advanced' ? (
                                <span className="text-purple-400">Unlocked</span>
                              ) : (
                                <span className="text-muted-foreground/50">Locked</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isActive ? (
                          <div className="w-full min-h-[44px] rounded-lg bg-white/[0.06] py-2.5 px-3 text-center text-xs font-semibold text-foreground/80 flex items-center justify-center gap-1.5 border border-white/[0.08]">
                            <Check size={14} className="text-emerald-400" />
                            <span>Active Plan</span>
                          </div>
                        ) : slug === 'free' ? (
                          <button
                            type="button"
                            onClick={() => handleSwitchTier('free')}
                            disabled={isSwitching}
                            className="w-full min-h-[44px] rounded-lg py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 bg-secondary text-foreground hover:bg-secondary/80 border border-white/[0.08]"
                          >
                            {isSwitching ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Switching…</span>
                              </>
                            ) : (
                              <span>Downgrade to Free</span>
                            )}
                          </button>
                        ) : canUseTestMode ? (
                          /* Test Mode (Dev or Admin): Instant Switch + Option to test real checkout */
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => handleSwitchTier(slug)}
                              disabled={isSwitching}
                              className={cn(
                                'w-full min-h-[40px] rounded-lg py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95',
                                isSelectedFromQuery
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 ring-2 ring-primary/40'
                                  : slug === 'pro'
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                                  : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
                              )}
                              title="Instant tier switch (Admin / Developer test mode)"
                            >
                              {isSwitching ? (
                                <>
                                  <RefreshCw size={13} className="animate-spin" />
                                  <span>Switching…</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={12} />
                                  <span>Instant Test {slug.toUpperCase()}</span>
                                  <ArrowRight size={12} />
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchTier(slug, { forceCheckout: true })}
                              disabled={isSwitching}
                              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-0.5"
                              title="Test the hosted Lemon Squeezy checkout flow"
                            >
                              <ExternalLink size={10} />
                              <span>Test Lemon Squeezy Checkout</span>
                            </button>
                          </div>
                        ) : appliedPromo && appliedPromo.planSlug === slug ? (
                          /* Public Visitor with Valid Promo Applied: Instant Tier Activation with Promo */
                          <button
                            type="button"
                            onClick={() => handleSwitchTier(slug)}
                            disabled={isSwitching}
                            className="w-full min-h-[44px] rounded-lg py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-500/40"
                          >
                            {isSwitching ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Activating {appliedPromo.code}…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Claim with {appliedPromo.code} (100% OFF)</span>
                                <ArrowRight size={13} />
                              </>
                            )}
                          </button>
                        ) : (
                          /* Public Visitor Mode: Real Lemon Squeezy Checkout Only */
                          <button
                            type="button"
                            onClick={() => handleSwitchTier(slug)}
                            disabled={isSwitching}
                            className={cn(
                              'w-full min-h-[44px] rounded-lg py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95',
                              isSelectedFromQuery
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 ring-2 ring-primary/40'
                                : slug === 'pro'
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
                            )}
                          >
                            {isSwitching ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Opening Lemon Squeezy…</span>
                              </>
                            ) : (
                              <>
                                <Lock size={12} className="opacity-80" />
                                <span>Upgrade to {meta.badge} ({meta.price}/mo)</span>
                                <ArrowRight size={13} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo & Partner Code Engine */}
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-card/40 p-4 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20">
                      <Tag size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Have a VIP Discount or Promo Code?</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Enter your exclusive coupon code (e.g. <code>RaamizPro</code> or <code>RaamizAdv</code>) to unlock plan discounts.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value);
                        setPromoError(null);
                      }}
                      placeholder="e.g. RaamizPro"
                      className="h-9 w-44 rounded-lg border border-white/[0.1] bg-black/40 px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none font-mono uppercase"
                    />
                    <button
                      type="submit"
                      disabled={promoLoading || !promoCodeInput.trim()}
                      className="h-9 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {promoLoading ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Checking…</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Applied promo badge or error banner */}
                {appliedPromo && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                      <span>
                        Coupon <strong>{appliedPromo.code}</strong> applied: {appliedPromo.displayName} ({appliedPromo.discountPercent}% VIP discount on {appliedPromo.planSlug.toUpperCase()} plan). Click above to claim!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCodeInput('');
                        setPromoError(null);
                      }}
                      className="text-xs font-semibold text-muted-foreground hover:text-white ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {promoError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 animate-in fade-in duration-200">
                    <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                    <span>{promoError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Active Plan Status & Limits Dashboard */}
            <div className="rounded-xl border border-white/[0.08] bg-card/60 p-5 backdrop-blur-md">
              {/* Lifetime Builder Badge */}
              {(subscription?.metadata?.isLifetimeGrant || (isAdmin && currentSlug === 'advanced')) && (
                <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-950/40 p-4 flex items-center gap-3.5 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                    <Crown size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-200">System Owner & Builder</span>
                      <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[9px] font-mono font-bold text-purple-300 uppercase tracking-wider border border-purple-500/30">
                        Lifetime Advanced Access
                      </span>
                    </div>
                    <p className="text-xs text-purple-300/80 mt-1">
                      Builder account ({subscription?.metadata?.grantedTo || 'raamizriaz111@gmail.com'}) has permanent Lifetime Advanced access. All 10 capability suites, blueprints, hourly digests, and programmatic REST API tokens are permanently unlocked.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-foreground">
                      {plan?.displayName ?? 'Free'} Plan Active
                    </span>
                    <StatusIndicator
                      status={subscription?.status === 'active' ? 'success' : 'running'}
                      label={subscription?.status || 'active'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan?.priceMonthlyUsd === 0
                      ? 'Free forever · All primary research and news feeds included'
                      : `$${plan?.priceMonthlyUsd}/month · Full capability privileges enabled`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {plan && plan.priceMonthlyUsd > 0 && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? 'Canceling…' : 'Cancel Plan'}
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Metric Counters for Active Plan */}
              {plan && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.06]">
                  <div className="rounded-lg bg-secondary/40 p-3 text-center border border-white/[0.04]">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">AI Ops / Day</p>
                    <p className="text-base font-bold text-foreground mt-0.5 font-mono">
                      {plan.limits.aiRequestsLimit.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3 text-center border border-white/[0.04]">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Briefings / Day</p>
                    <p className="text-base font-bold text-foreground mt-0.5 font-mono">
                      {plan.limits.briefingsLimit}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3 text-center border border-white/[0.04]">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Tracked Topics</p>
                    <p className="text-base font-bold text-foreground mt-0.5 font-mono">
                      {plan.limits.trackedTopicsLimit}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3 text-center border border-white/[0.04]">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Stream Density</p>
                    <p className="text-base font-bold text-foreground mt-0.5 font-mono">
                      {plan.limits.itemsPerPageLimit || 20} / page
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Live Usage Today */}
            {usagePeriod && (
              <div className="rounded-xl border border-white/[0.08] bg-card/60 p-5 backdrop-blur-md">
                <SectionHeader
                  title="Today's Operational Quota"
                  description={`Resets every night at midnight UTC. Period ends ${new Date(usagePeriod.periodEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                />
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Zap size={12} className="text-primary" />
                        <span>AI Operations Allowance</span>
                      </span>
                      <span className="tabular-nums text-foreground font-mono font-medium">
                        {usagePeriod.aiRequestsUsed} / {usagePeriod.aiRequestsLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          usagePct(usagePeriod.aiRequestsUsed, usagePeriod.aiRequestsLimit) > 80
                            ? 'bg-amber-400'
                            : 'bg-primary'
                        )}
                        style={{ width: `${Math.max(4, usagePct(usagePeriod.aiRequestsUsed, usagePeriod.aiRequestsLimit))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-emerald-400" />
                        <span>Personalized Daily Briefings</span>
                      </span>
                      <span className="tabular-nums text-foreground font-mono font-medium">
                        {usagePeriod.briefingsUsed} / {usagePeriod.briefingsLimit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          usagePct(usagePeriod.briefingsUsed, usagePeriod.briefingsLimit) > 80
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        )}
                        style={{ width: `${Math.max(4, usagePct(usagePeriod.briefingsUsed, usagePeriod.briefingsLimit))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: Comprehensive Tier Differences & Feature Gate Matrix */}
            <div className="rounded-xl border border-white/[0.08] bg-card/60 p-5 backdrop-blur-md">
              <SectionHeader
                title="Capability Matrix Across Tiers"
                description="Live status of what is unlocked for your current tier versus other plans."
              />
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-muted-foreground font-mono">
                      <th className="py-2.5 text-left font-semibold">Capability</th>
                      <th className={cn('py-2.5 px-3 text-center font-semibold', currentSlug === 'free' && 'text-emerald-400 bg-emerald-500/10 rounded-t')}>
                        Free {currentSlug === 'free' && '• Current'}
                      </th>
                      <th className={cn('py-2.5 px-3 text-center font-semibold', currentSlug === 'pro' && 'text-blue-400 bg-blue-500/10 rounded-t')}>
                        Pro {currentSlug === 'pro' && '• Current'}
                      </th>
                      <th className={cn('py-2.5 px-3 text-center font-semibold', currentSlug === 'advanced' && 'text-purple-400 bg-purple-500/10 rounded-t')}>
                        Advanced {currentSlug === 'advanced' && '• Current'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Mail size={13} className="text-blue-400" />
                        <span>7:00 AM Morning Executive Email Digest</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Web-Only
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-semibold">
                          <Check size={12} /> 7:00 AM Inbox
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                          <Check size={12} /> Hourly / Instant
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Bell size={13} className="text-emerald-400" />
                        <span>Breaking Model & Benchmark Alerts</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> Email Alerts
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                          <Check size={12} /> Real-Time Push
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Tag size={13} className="text-primary" />
                        <span>Custom Keyword Trigger Alerts</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center font-mono text-muted-foreground/50', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>0 triggers</td>
                      <td className={cn('py-2.5 px-3 text-center font-mono text-blue-400 font-semibold', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>25 triggers</td>
                      <td className={cn('py-2.5 px-3 text-center font-mono text-purple-400 font-semibold', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>100 triggers</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Webhook size={13} className="text-purple-400" />
                        <span>Multi-Channel Webhook / Telegram Delivery</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                          <Check size={12} /> Discord / Slack / Telegram
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Code size={13} className="text-emerald-400" />
                        <span>Code & Architectural Blueprints</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> In Digest
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> In Digest + JSON
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Download size={13} className="text-emerald-400" />
                        <span>Data & Citations Export</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> Unlocked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> Unlocked
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <SlidersHorizontal size={13} className="text-amber-400" />
                        <span>Advanced Intelligence Filters</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center text-muted-foreground', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>Standard</td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> Unlocked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <Check size={12} /> Unlocked
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Key size={13} className="text-purple-400" />
                        <span>Programmatic REST API</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Lock size={11} /> Locked
                        </span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                          <Check size={12} /> API Tokens
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Zap size={13} className="text-primary" />
                        <span>Daily AI Requests Allowance</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center font-mono', currentSlug === 'free' && 'bg-emerald-500/[0.04] font-bold text-foreground')}>100 / day</td>
                      <td className={cn('py-2.5 px-3 text-center font-mono', currentSlug === 'pro' && 'bg-blue-500/[0.04] font-bold text-foreground')}>1,000 / day (10x)</td>
                      <td className={cn('py-2.5 px-3 text-center font-mono', currentSlug === 'advanced' && 'bg-purple-500/[0.04] font-bold text-foreground')}>10,000 / day (100x)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-foreground font-medium flex items-center gap-2">
                        <Shield size={13} className="text-blue-400" />
                        <span>Support Priority</span>
                      </td>
                      <td className={cn('py-2.5 px-3 text-center text-muted-foreground', currentSlug === 'free' && 'bg-emerald-500/[0.04]')}>Community</td>
                      <td className={cn('py-2.5 px-3 text-center text-muted-foreground', currentSlug === 'pro' && 'bg-blue-500/[0.04]')}>Standard</td>
                      <td className={cn('py-2.5 px-3 text-center', currentSlug === 'advanced' && 'bg-purple-500/[0.04]')}>
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                          <Check size={12} /> Priority SLA
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 5: Autonomous Push & Morning Email Alerts */}
            <div id="email-alerts">
              <EmailAlertSettings
                currentPlanSlug={currentSlug as any}
                onUpgradeClick={(tier) => handleSwitchTier(tier)}
              />
            </div>

            {/* SECTION 5.5: Programmatic REST API & Personal Access Token Console */}
            <div id="api-console" className="rounded-2xl border border-white/[0.1] bg-card/70 p-5 md:p-6 backdrop-blur-md shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal size={17} className="text-purple-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      Programmatic REST API & Token Manager
                    </h3>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase',
                      currentSlug === 'advanced'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-white/[0.06] text-muted-foreground border border-white/[0.08]'
                    )}>
                      {currentSlug === 'advanced' ? 'Advanced Plan Unlocked' : 'Advanced Plan Only ($20/mo)'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Direct headless machine-to-machine access to AI Radar&apos;s normalized intelligence index and unified search endpoints.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Rate Limit: <strong className="text-foreground">{currentSlug === 'advanced' ? '10,000 req/day' : 'Locked'}</strong>
                  </span>
                </div>
              </div>

              {currentSlug === 'advanced' ? (
                /* Unlocked Advanced REST Console */
                <div className="space-y-4">
                  {/* Token Card */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.06] p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Key size={14} className="text-purple-400" />
                        <span className="text-xs font-bold text-foreground">
                          Production Personal Bearer Token
                        </span>
                        <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-300/80">
                        Never share secret tokens in public repositories
                      </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/60 px-3 py-2">
                      <input
                        type={showApiToken ? 'text' : 'password'}
                        readOnly
                        value={mockApiToken}
                        className="w-full bg-transparent font-mono text-xs text-purple-200 outline-none selection:bg-purple-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiToken(!showApiToken)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title={showApiToken ? 'Hide token' : 'Show token'}
                      >
                        {showApiToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyToken}
                        className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-2 py-1 text-[11px] font-mono font-semibold text-purple-200 hover:bg-purple-500/30 transition-colors"
                      >
                        {copiedToken ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ready-to-run curl snippet */}
                  <div className="rounded-xl border border-white/[0.08] bg-black/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground font-mono flex items-center gap-1.5">
                        <Terminal size={13} className="text-primary" />
                        <span>Ready-to-Run cURL Request</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCurl}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedCurl ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">cURL Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-white/[0.06] bg-black/80 p-3 font-mono text-[11px] leading-relaxed text-blue-300">
                      {`curl -s "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/search?q=agents" \\\n  -H "Authorization: Bearer ${mockApiToken}"`}
                    </pre>
                  </div>

                  {/* Live In-Browser REST Sandbox Execution */}
                  <div className="rounded-xl border border-white/[0.08] bg-secondary/30 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Play size={13} className="text-emerald-400" />
                          <span>Live In-Browser API Test Runner</span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Execute an authenticated query against <code className="text-primary">/api/search?q=agents&limit=3</code> right now.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestApi}
                        disabled={apiTestLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 transition-all disabled:opacity-50 active:scale-95"
                      >
                        {apiTestLoading ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Querying Ingestion Pipeline…</span>
                          </>
                        ) : (
                          <>
                            <Play size={12} />
                            <span>Run Test Query in Console</span>
                          </>
                        )}
                      </button>
                    </div>

                    {apiTestResult && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={11} /> 200 OK · Ingestion Response Payload
                          </span>
                          <span>{apiTestResult.results?.total || 0} Records Returned</span>
                        </div>
                        <pre className="max-h-56 overflow-y-auto rounded-lg border border-emerald-500/20 bg-black/80 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
                          {JSON.stringify(apiTestResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Locked Free/Pro REST Console Teaser */
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex-shrink-0">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Programmatic REST Ingestion & Tokens Reserved for Advanced Tier ($20/mo)
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Query the AI Radar intelligence database headlessly, ingest structured items into your local LangChain / agent workflows, and receive real-time webhook notifications.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-black/40 p-3 space-y-2 opacity-75">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Key size={11} /> Personal Bearer Token
                      </span>
                      <span className="text-purple-400">Locked</span>
                    </div>
                    <div className="rounded bg-black/80 px-2.5 py-1.5 font-mono text-xs text-muted-foreground/60 select-none">
                      airadar_live_sec_••••••••••••••••••••••••••••
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs text-purple-300">
                      <Sparkles size={13} className="text-purple-400" />
                      <span>
                        {canUseTestMode
                          ? 'Test in 1 click using developer sandbox:'
                          : 'Unlock immediately via Lemon Squeezy checkout:'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchTier('advanced')}
                      disabled={switchingTier === 'advanced'}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 transition-all active:scale-95"
                    >
                      <Building2 size={13} />
                      <span>
                        {canUseTestMode
                          ? 'Unlock REST API Console — Switch to Advanced ($20/mo)'
                          : 'Upgrade to Advanced ($20/mo)'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: Feature Testing Launchpad */}
            <div className="rounded-xl border border-white/[0.08] bg-card/60 p-5 backdrop-blur-md">
              <SectionHeader
                title="Feature Testing Launchpad"
                description="Direct links to test the features unlocked by your currently active plan."
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                <Link
                  href="/bookmarks"
                  className="group rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-all hover:border-emerald-500/30 hover:bg-card/80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Download size={14} />
                    </div>
                    {plan?.features.export ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">Unlocked</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 font-mono">Pro Feature</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Test Saved Stories Export
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Export your saved stories bibliography to Markdown and citations.
                  </p>
                </Link>

                <Link
                  href="/settings"
                  className="group rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-all hover:border-blue-500/30 hover:bg-card/80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Tag size={14} />
                    </div>
                    <span className="text-[10px] text-primary font-mono font-bold">
                      {plan?.limits.trackedTopicsLimit} Topics
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Test Topic Limits
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Configure custom AI topics up to your active tier allowance in Settings.
                  </p>
                </Link>

                <Link
                  href="/briefing"
                  className="group rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-all hover:border-purple-500/30 hover:bg-card/80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <Zap size={14} />
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">
                      {plan?.limits.briefingsLimit} / Day
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Test Daily Briefing
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Generate an executive daily intelligence digest with primary citations.
                  </p>
                </Link>

                <a
                  href="#api-console"
                  className="group rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-all hover:border-purple-500/30 hover:bg-card/80"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <Terminal size={14} />
                    </div>
                    {currentSlug === 'advanced' ? (
                      <span className="text-[10px] text-purple-400 font-mono font-bold">Unlocked</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 font-mono">Advanced</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-purple-300 transition-colors">
                    REST API Console
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Manage Bearer token and test live programmatic endpoints.
                  </p>
                </a>
              </div>
            </div>

            {/* SECTION 6: Payment Records */}
            <div className="rounded-xl border border-white/[0.08] bg-card/60 p-5 backdrop-blur-md">
              <SectionHeader
                title="Payment History"
                description="Invoices and transaction receipts."
              />
              {invoices.length > 0 ? (
                <div className="rounded-lg border border-white/[0.06] bg-card overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-secondary/30">
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-4 py-3 text-foreground font-mono">
                            {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                            ${inv.amountPaidUsd.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusIndicator
                              status={inv.status === 'paid' ? 'success' : inv.status === 'open' ? 'warning' : 'error'}
                              label={inv.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-white/[0.06] bg-card/30 px-4 py-6 text-center">
                  <CreditCard size={18} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {plan && plan.priceMonthlyUsd === 0
                      ? 'No payment history — you are testing on the Free tier.'
                      : 'Testing sandbox active — no credit card charged.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
