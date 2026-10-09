'use client';

// =============================================================================
// AI Radar — In-Page Checkout & Plan Upgrade Modal
// =============================================================================
// Provides in-page checkout without navigating away from the pricing page.
// Includes order breakdown, billing interval toggle, secure account details,
// and private promotional coupon validation (with zero disclosure of private keys).
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Star,
  Building2,
  Zap,
  Lock,
  ShieldCheck,
  CreditCard,
  Tag,
  ArrowRight,
} from 'lucide-react';
import type { PlanConfig } from '@/lib/billing/planConfig';
import { cn } from '@/lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanConfig;
  initialInterval?: 'monthly' | 'annual';
  user: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  } | null;
  onPlanActivated?: (updatedPlanSlug: string) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  plan,
  initialInterval = 'monthly',
  user,
  onPlanActivated,
}: CheckoutModalProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>(initialInterval);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    planSlug: string;
    discountPercent: number;
    displayName: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  if (!isOpen) return null;

  const isPro = plan.slug === 'pro';
  const isAdvanced = plan.slug === 'advanced';
  const PlanIcon = isPro ? Star : isAdvanced ? Building2 : Zap;

  // Calculate pricing
  const isAnnual = interval === 'annual';
  const basePrice = isAnnual && plan.priceAnnualUsd ? plan.priceAnnualUsd : plan.priceMonthlyUsd;
  const effectiveMonthly = isAnnual && plan.priceAnnualUsd ? (plan.priceAnnualUsd / 12).toFixed(2) : plan.priceMonthlyUsd;

  const discountPercent = appliedPromo && appliedPromo.planSlug === plan.slug ? appliedPromo.discountPercent : 0;
  const discountAmount = (basePrice * discountPercent) / 100;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Apply promo code handler (validates against server without revealing secrets)
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || promoLoading) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch('/api/billing/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          planSlug: plan.slug,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid || !data.coupon) {
        throw new Error(data.error || 'Invalid or expired promo code.');
      }

      setAppliedPromo({
        code: data.coupon.code,
        planSlug: data.coupon.planSlug,
        discountPercent: data.coupon.discountPercent,
        displayName: data.coupon.displayName || 'VIP Discount',
      });
      setPromoCodeInput('');
    } catch (err: any) {
      setPromoError(err?.message || 'Invalid or expired promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Checkout execution handler
  const handleProceed = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    // If guest, redirect to login with return intent
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/pricing?select=${plan.slug}&interval=${interval}`)}`;
      return;
    }

    try {
      // 1. If 100% discount applied: instant activation without gateway redirect
      if (finalPrice === 0 && appliedPromo) {
        const subRes = await fetch('/api/billing/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: plan.slug,
            billingInterval: interval,
            promoCode: appliedPromo.code,
          }),
        });

        const subData = await subRes.json();
        if (!subRes.ok || !subData.ok) {
          throw new Error(subData.error || 'Failed to activate tier with promotional code.');
        }

        setActivatedSuccess(true);
        if (onPlanActivated) {
          onPlanActivated(plan.slug);
        }
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }

      // 2. Paid checkout: create hosted checkout session
      const checkoutRes = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingInterval: interval,
          promoCode: appliedPromo?.code,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.checkoutUrl) {
        throw new Error(checkoutData.error || 'Failed to initialize payment gateway.');
      }

      // Open hosted checkout
      window.location.href = checkoutData.checkoutUrl;
    } catch (err: any) {
      setCheckoutError(err?.message || 'Something went wrong during checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0c1017] p-6 shadow-2xl text-foreground max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.06] transition-colors"
          aria-label="Close checkout modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6 pr-8">
          <div
            className={cn(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border shadow-inner',
              isPro
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            )}
          >
            <PlanIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Upgrade to {plan.displayName}</h2>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary uppercase">
                {interval}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Instant access to autonomous executive intelligence &amp; breaking radar.
            </p>
          </div>
        </div>

        {/* Success state */}
        {activatedSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Plan Activated!</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Welcome to <strong>{plan.displayName}</strong>. Your intelligence quotas and delivery features are now live.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Error banner */}
            {checkoutError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Billing Interval Toggle inside checkout */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Billing Interval</p>
                <p className="text-[11px] text-muted-foreground">
                  {isAnnual ? 'Save ~17% with annual billing' : 'Flexible month-to-month'}
                </p>
              </div>

              <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setInterval('monthly')}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                    interval === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval('annual')}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all flex items-center gap-1',
                    interval === 'annual'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>Annual</span>
                  <span className="rounded bg-emerald-500/20 text-emerald-300 px-1 py-0.2 text-[9px] font-mono">
                    -17%
                  </span>
                </button>
              </div>
            </div>

            {/* Order Summary & Pricing Details */}
            <div className="rounded-xl border border-white/[0.08] bg-secondary/20 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Plan Subtotal ({interval})</span>
                <span className="font-mono font-medium text-foreground">${basePrice.toFixed(2)}</span>
              </div>

              {isAnnual && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 font-mono">
                  <span>Effective rate</span>
                  <span>${effectiveMonthly}/month</span>
                </div>
              )}

              {/* Discount line item */}
              {discountPercent > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Tag size={12} />
                    <span>{appliedPromo?.displayName || 'VIP Discount'} ({discountPercent}% off)</span>
                  </span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-white/[0.08] pt-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">Total Due Today</span>
                  <p className="text-[10px] text-muted-foreground/70 font-mono">Billed securely in USD</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold font-mono text-foreground">
                    ${finalPrice.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono ml-1">
                    /{interval === 'annual' ? 'yr' : 'mo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account:</span>
                {user ? (
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>{user.email || user.name || 'Verified User'}</span>
                  </span>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/pricing?select=${plan.slug}&interval=${interval}`)}`}
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Sign in to connect account</span>
                    <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            </div>

            {/* In-Checkout Promo Code Section */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="checkoutPromo" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag size={12} className="text-primary" />
                  <span>Promo / Partner Code</span>
                </label>
                {appliedPromo && (
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-[11px] font-medium text-muted-foreground hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    <span>
                      Code active: <strong>{appliedPromo.displayName}</strong> ({appliedPromo.discountPercent}% off)
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    id="checkoutPromo"
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value);
                      setPromoError(null);
                    }}
                    placeholder="Enter promo code"
                    className="h-9 flex-1 rounded-lg border border-white/[0.1] bg-black/40 px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={promoLoading || !promoCodeInput.trim()}
                    className="h-9 rounded-lg bg-white/[0.08] border border-white/[0.1] px-4 text-xs font-semibold text-foreground hover:bg-white/[0.12] transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {promoLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </form>
              )}

              {promoError && (
                <p className="mt-2 text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} className="flex-shrink-0" />
                  <span>{promoError}</span>
                </p>
              )}
            </div>

            {/* Action Checkout Button */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={checkoutLoading}
              className={cn(
                'w-full min-h-[44px] rounded-xl py-3 px-4 text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                isPro
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25'
                  : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/25'
              )}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Preparing secure checkout…</span>
                </>
              ) : finalPrice === 0 ? (
                <>
                  <Sparkles size={14} />
                  <span>Claim &amp; Activate {plan.displayName} Instantly</span>
                </>
              ) : (
                <>
                  <Lock size={13} />
                  <span>Proceed to Payment (${finalPrice.toFixed(2)})</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            {/* Trust Strip */}
            <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground/70 font-mono">
              <span className="flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" />
                <span>256-Bit SSL</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={11} className="text-primary" />
                <span>Lemon Squeezy MoR</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <CreditCard size={10} className="text-amber-400" />
                <span>Cards, PayPal, Apple Pay</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
