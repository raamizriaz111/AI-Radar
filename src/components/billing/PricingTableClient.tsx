'use client';

// =============================================================================
// AI Radar — Senior Executive Interactive Pricing & Plan Management
// =============================================================================
// Unified in-page upgrade experience: clicking upgrade opens the CheckoutModal
// directly without loading another page. Includes in-checkout promo validation
// and administrator testing controls.
// =============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  Star,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import type { PlanConfig } from '@/lib/billing/planConfig';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { CheckoutModal } from '@/components/billing/CheckoutModal';
import { cn } from '@/lib/utils';

interface PricingTableClientProps {
  plans: PlanConfig[];
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  pro: Star,
  advanced: Building2,
};

export function PricingTableClient({ plans }: PricingTableClientProps) {
  const { user, authenticated } = useAuthUser();
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>('free');

  // Modal checkout state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanConfig | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Status & admin state
  const [adminLoading, setAdminLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch current user subscription tier
    fetch('/api/billing/subscription')
      .then((res) => res.json())
      .then((data) => {
        if (data?.plan?.slug) {
          setCurrentPlanSlug(data.plan.slug);
        }
      })
      .catch(() => {});

    // 2. Check query params for instant checkout or payment confirmation
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const selectParam = params.get('select');
      const intervalParam = params.get('interval') as 'monthly' | 'annual' | null;

      if (intervalParam === 'annual' || intervalParam === 'monthly') {
        setInterval(intervalParam);
      }

      if (selectParam) {
        const target = plans.find((p) => p.slug === selectParam);
        if (target && target.slug !== 'free') {
          setSelectedPlanForCheckout(target);
          setIsCheckoutOpen(true);
        }
      }

      if (params.get('success') === 'true') {
        setSuccessBanner('Payment successful! Your intelligence subscription is active.');
        setTimeout(() => setSuccessBanner(null), 6000);
      }
    }
  }, [plans]);

  const openCheckout = (plan: PlanConfig) => {
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
  };

  const handlePlanActivated = (newSlug: string) => {
    setCurrentPlanSlug(newSlug);
    setSuccessBanner(`Your account has been upgraded to ${newSlug.toUpperCase()}!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleAdminTierSwitch = async (targetSlug: string) => {
    if (adminLoading) return;
    setAdminLoading(true);
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: targetSlug,
          billingInterval: interval,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCurrentPlanSlug(targetSlug);
        setSuccessBanner(`Admin sandbox: Switched active tier to ${targetSlug.toUpperCase()}.`);
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch {
      // Ignore admin sandbox errors
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSwitchToFree = async () => {
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: 'free',
          billingInterval: 'none',
        }),
      });
      if (res.ok) {
        setCurrentPlanSlug('free');
        setSuccessBanner('Switched back to Free tier.');
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {successBanner && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Administrator Interactive Sandbox (Visible strictly to admins) */}
      {user?.role === 'admin' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>Administrator Interactive Sandbox</span>
            </span>
            <span className="text-[10px] text-amber-300/70 font-mono">Admin testing mode</span>
          </div>
          <p className="text-muted-foreground mb-3 text-[11px]">
            Test feature sets instantly with zero-billing 1-click tier switching.
          </p>
          <div className="flex items-center gap-2">
            {['free', 'pro', 'advanced'].map((slug) => (
              <button
                key={slug}
                type="button"
                disabled={adminLoading}
                onClick={() => handleAdminTierSwitch(slug)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                  currentPlanSlug === slug
                    ? 'bg-amber-400 text-black font-bold shadow-sm'
                    : 'bg-white/[0.05] border border-white/[0.08] text-foreground hover:bg-white/[0.1]'
                )}
              >
                {slug} Tier
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Billing Interval Switcher */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex items-center rounded-full border border-white/[0.1] bg-secondary/50 p-1 shadow-inner backdrop-blur-md">
          <button
            type="button"
            onClick={() => setInterval('monthly')}
            className={cn(
              'rounded-full px-5 py-1.5 text-xs font-semibold transition-all duration-200',
              interval === 'monthly'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Monthly Billing
          </button>

          <button
            type="button"
            onClick={() => setInterval('annual')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-5 py-1.5 text-xs font-semibold transition-all duration-200',
              interval === 'annual'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Annual Billing</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider',
              interval === 'annual'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            )}>
              Save ~17%
            </span>
          </button>
        </div>

        <p className="text-[11px] font-mono text-muted-foreground/80">
          {interval === 'annual'
            ? '⚡ 2 Months Free on Annual Plans · Billed Once Annually'
            : 'Flexible Month-to-Month · Cancel Anytime in 1 Click'}
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3 pt-3">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.slug] ?? Zap;
          const isPro = plan.slug === 'pro';
          const isAdvanced = plan.slug === 'advanced';
          const isCurrentActive = currentPlanSlug === plan.slug;

          // Compute pricing based on active interval
          const isAnnual = interval === 'annual';
          const effectiveMonthlyPrice = isAnnual && plan.priceAnnualUsd
            ? (plan.priceAnnualUsd / 12).toFixed(2)
            : plan.priceMonthlyUsd;

          const annualTotal = plan.priceAnnualUsd;
          const annualSavings = plan.priceAnnualUsd
            ? plan.priceMonthlyUsd * 12 - plan.priceAnnualUsd
            : 0;

          return (
            <div
              key={plan.slug}
              className={cn(
                'relative flex flex-col justify-between rounded-2xl border bg-card/85 p-6 backdrop-blur-md transition-all duration-200 shadow-md',
                isPro
                  ? 'border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/40 bg-gradient-to-b from-primary/[0.04] to-card/90'
                  : isAdvanced
                  ? 'border-purple-500/40 shadow-lg shadow-purple-500/10 hover:border-purple-500/60 bg-gradient-to-b from-purple-500/[0.03] to-card/90'
                  : 'border-white/[0.08] hover:border-white/20'
              )}
            >
              {/* Card Header & Content */}
              <div>
                <div className="mb-4 flex items-center justify-between min-h-[22px]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    {plan.slug === 'free' ? 'Starter Tier' : plan.slug === 'pro' ? 'Intelligence Tier' : 'Full Power Suite'}
                  </span>
                  {isPro ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-blue-500 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-widest shadow-sm">
                      <Sparkles size={10} />
                      Most Popular
                    </span>
                  ) : isAdvanced ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-950/80 px-2.5 py-0.5 text-[9px] font-mono font-bold text-purple-300 uppercase tracking-widest shadow-sm">
                      Power Engineers
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono text-muted-foreground/70 uppercase">
                      Standard
                    </span>
                  )}
                </div>

                {/* Plan Title & Icon */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
                        isPro
                          ? 'bg-primary/15 text-primary border border-primary/25'
                          : isAdvanced
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                          : 'bg-secondary text-muted-foreground border border-white/[0.06]'
                      )}
                    >
                      <Icon size={19} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base leading-tight tracking-tight">
                        {plan.displayName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {plan.slug === 'free'
                          ? 'Manual web intelligence'
                          : plan.slug === 'pro'
                          ? 'Autonomous morning digest'
                          : 'Real-time API & webhooks'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Block */}
                <div className="mb-6 rounded-xl border border-white/[0.04] bg-secondary/30 p-3.5">
                  {plan.slug === 'free' ? (
                    <div>
                      <span className="text-3xl font-extrabold text-foreground font-mono">$0</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">/ free forever</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-foreground font-mono">
                          ${effectiveMonthlyPrice}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          / month
                        </span>
                      </div>

                      {isAnnual && annualTotal ? (
                        <p className="text-[11px] text-emerald-400 mt-1 font-mono font-medium">
                          Billed ${annualTotal}/year · Save ${annualSavings}/yr
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                          Billed monthly · Cancel anytime
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Feature List */}
                <ul className="space-y-2.5 mb-6 text-xs">
                  {plan.slug === 'free' && (
                    <>
                      <li className="flex items-center gap-2 text-foreground/90">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>Manual web dashboard access</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground/90">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>10 on-demand briefings / day</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground/90">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>20 custom tracked topics</span>
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground/60">
                        <span className="text-[10px] font-bold">✕</span>
                        <span>No automated morning email dispatch</span>
                      </li>
                    </>
                  )}

                  {plan.slug === 'pro' && (
                    <>
                      <li className="flex items-center gap-2 text-foreground font-semibold">
                        <Check size={13} className="text-blue-400 flex-shrink-0" />
                        <span>Daily 7:00 AM Executive Email Digest</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground font-semibold">
                        <Check size={13} className="text-blue-400 flex-shrink-0" />
                        <span>Instant Breaking Foundation Model Alerts</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>Deep Technical Architecture Blueprints</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>Saved stories Markdown citation export</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>1,000 AI operations/day & 100 topics</span>
                      </li>
                    </>
                  )}

                  {plan.slug === 'advanced' && (
                    <>
                      <li className="flex items-center gap-2 text-foreground font-semibold">
                        <Check size={13} className="text-purple-400 flex-shrink-0" />
                        <span>Real-Time Push Alerts & Hourly Digests</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground font-semibold">
                        <Check size={13} className="text-purple-400 flex-shrink-0" />
                        <span>Multi-Channel Webhook & Telegram Alerts</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>Programmatic REST API Console & Tokens</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>BibTeX / JSON / Markdown citation exports</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>10,000 AI operations/day & 500 topics</span>
                      </li>
                      <li className="flex items-center gap-2 text-foreground">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>Priority SLA support & Early radar access</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Action Button: Opens Checkout Modal in-page without reloading */}
              <div>
                {plan.slug === 'free' ? (
                  isCurrentActive ? (
                    <div className="w-full min-h-[42px] rounded-xl px-4 py-2.5 text-center text-xs font-semibold border border-white/[0.08] bg-white/[0.03] text-muted-foreground flex items-center justify-center gap-1.5 cursor-default">
                      <span>Current Plan</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSwitchToFree}
                      className="w-full min-h-[42px] rounded-xl px-4 py-2.5 text-center text-xs font-semibold border border-white/[0.08] bg-secondary/80 text-foreground hover:bg-secondary flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Switch to Free Plan</span>
                    </button>
                  )
                ) : isCurrentActive ? (
                  <div className="w-full min-h-[42px] rounded-xl px-4 py-2.5 text-center text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-1.5 cursor-default">
                    <CheckCircle2 size={13} />
                    <span>Active Subscription</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout(plan)}
                    className={cn(
                      'w-full min-h-[42px] rounded-xl px-4 py-2.5 text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer',
                      isPro
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25'
                        : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/25'
                    )}
                  >
                    <Sparkles size={13} />
                    <span>
                      {isAnnual
                        ? `Upgrade to ${plan.displayName} Annual ($${plan.priceAnnualUsd})`
                        : `Upgrade to ${plan.displayName} ($${plan.priceMonthlyUsd}/mo)`}
                    </span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Payment & Merchant Trust Strip */}
      <div className="rounded-xl border border-white/[0.08] bg-card/60 p-4 text-center space-y-2.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
            <Lock size={13} className="text-emerald-400" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <span className="hidden sm:inline text-white/20">·</span>
          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
            <ShieldCheck size={14} className="text-primary" />
            <span>Merchant of Record: Lemon Squeezy</span>
          </div>
          <span className="hidden sm:inline text-white/20">·</span>
          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
            <CreditCard size={13} className="text-amber-400" />
            <span>Visa, Mastercard, PayPal, Apple Pay, Google Pay</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          International receipts & tax compliance handled automatically. Cancel anytime in 1 click from your dashboard.
        </p>
      </div>

      {/* In-Page Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedPlanForCheckout(null);
          }}
          plan={selectedPlanForCheckout}
          initialInterval={interval}
          user={user}
          onPlanActivated={handlePlanActivated}
        />
      )}
    </div>
  );
}
