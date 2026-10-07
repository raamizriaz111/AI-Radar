'use client';

// =============================================================================
// AI Radar — Senior Executive Interactive Pricing Table
// =============================================================================
// Supports instant Monthly / Annual toggle with live discount calculation,
// dynamic interval routing, and Lemon Squeezy MoR trust badges.
// =============================================================================

import React, { useState } from 'react';
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
} from 'lucide-react';
import type { PlanConfig } from '@/lib/billing/planConfig';
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
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="space-y-8">
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
                {/* Top Badge & Tier Row (In-flow: Zero overlap, perfectly visible across all screen sizes) */}
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

              {/* Action Link Button */}
              <Link
                href={
                  plan.slug === 'free'
                    ? '/account/billing'
                    : `/account/billing?select=${plan.slug}&interval=${interval}`
                }
                className={cn(
                  'w-full min-h-[42px] rounded-xl px-4 py-2.5 text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95',
                  isPro
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25'
                    : isAdvanced
                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/25'
                    : 'border border-white/[0.08] bg-secondary/80 text-foreground hover:bg-secondary'
                )}
              >
                {plan.slug === 'free' ? (
                  <span>Get Started Free</span>
                ) : isPro ? (
                  <>
                    <Sparkles size={13} />
                    <span>
                      {isAnnual ? 'Upgrade to Pro Annual ($100)' : 'Upgrade to Pro ($10/mo)'}
                    </span>
                    <ArrowRight size={13} />
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>
                      {isAnnual ? 'Upgrade to Advanced Annual ($200)' : 'Upgrade to Advanced ($20/mo)'}
                    </span>
                    <ArrowRight size={13} />
                  </>
                )}
              </Link>
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
    </div>
  );
}
