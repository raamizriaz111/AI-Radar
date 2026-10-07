'use client';

// =============================================================================
// AI Radar — Senior Executive Intelligence Welcome Banner
// =============================================================================
// Displays a refined, high-density executive signal overview on the Live
// Intelligence page, highlighting primary source verification, plain-English
// synthesis, and forward horizon tracking. Fully dismissible with persistence.
// =============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  Radio,
  BookOpen,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

interface HeroWelcomeBannerProps {
  isAuthenticated?: boolean;
}

export function HeroWelcomeBanner({ isAuthenticated = true }: HeroWelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // If visitor previously dismissed, maintain dismissed state
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const isDismissed = window.localStorage.getItem('ai_radar_hero_dismissed') === 'true';
        if (isDismissed) {
          setDismissed(true);
        }
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ai_radar_hero_dismissed', 'true');
      }
    } catch {}
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card via-card/90 to-primary/[0.04] p-6 sm:p-7 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 bg-cyan-500/5 blur-[90px]" />
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        title="Dismiss introduction"
        className="absolute right-4 top-4 z-20 rounded-lg p-1.5 text-muted-foreground/50 hover:bg-white/[0.06] hover:text-foreground transition-all"
        aria-label="Dismiss banner"
      >
        <X size={15} />
      </button>

      <div className="relative z-10 max-w-4xl space-y-4">
        {/* Top Badges Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary font-mono uppercase tracking-wider shadow-sm">
            <Radio size={11} className="animate-pulse text-primary" />
            <span>AI Radar Signal Layer</span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            <ShieldCheck size={11} />
            <span>Primary Sources Only · Zero Hallucinations</span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
            <span>Surveillance: 24/7 Multi-Engine</span>
          </span>
        </div>

        {/* Main Headline & Synthesis */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Cut through the noise. Understand the breakthroughs before the public.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Continuous multi-source surveillance across academic preprints, frontier model weights, open-source repositories, and developer automation — synthesized into actionable plain-English intelligence.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-3.5 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Zap size={13} />
              </div>
              <span className="font-semibold text-foreground text-xs">
                Plain English Summaries
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              No PhD required. Understand real-world impacts, technical tradeoffs, and architectural shifts in seconds.
            </p>
          </div>

          <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-3.5 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck size={13} />
              </div>
              <span className="font-semibold text-foreground text-xs">
                Verified Citations
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every single claim links directly to primary sources: official arXiv papers, code repositories, or release notes.
            </p>
          </div>

          <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-3.5 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Sparkles size={13} />
              </div>
              <span className="font-semibold text-foreground text-xs">
                Forward Horizon
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Track upcoming model releases, EU AI Act milestones, and emerging momentum before it reaches social media.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/briefing"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <BookOpen size={13} />
            <span>Read Today&apos;s 5-Min Executive Briefing</span>
            <ArrowRight size={12} />
          </Link>

          <Link
            href="/trends"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 px-3.5 py-2.5 text-xs font-semibold text-foreground transition-all"
          >
            <TrendingUp size={13} className="text-cyan-400" />
            <span>Explore Emerging Trends</span>
          </Link>

          <Link
            href="/settings"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <SlidersHorizontal size={13} />
            <span>Customize Signal Filters</span>
          </Link>

          <button
            onClick={handleDismiss}
            className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors ml-auto hidden md:inline-block"
          >
            Dismiss banner
          </button>
        </div>
      </div>
    </div>
  );
}
