'use client';

// =============================================================================
// AI Radar — Senior Executive Intelligence Command Header
// =============================================================================
// Permanent, high-authority intelligence command deck on the Live
// Intelligence feed. Synthesizes primary source verification, plain-English
// insights, and forward horizon tracking. Built as an integral, non-dismissible
// operational surface for analysts, executives, and builders.
// =============================================================================

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  BookOpen,
  TrendingUp,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';

interface HeroWelcomeBannerProps {
  isAuthenticated?: boolean;
}

export function HeroWelcomeBanner({ isAuthenticated = true }: HeroWelcomeBannerProps) {
  return (
    <section
      aria-labelledby="command-header-heading"
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/95 via-card/85 to-primary/[0.03] p-6 sm:p-7 md:p-8 backdrop-blur-xl shadow-2xl shadow-black/40"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 bg-cyan-500/5 blur-[90px]" />
      </div>

      <div className="relative z-10 max-w-5xl space-y-5">
        {/* Top Badges & Real-Time Operational Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary font-mono uppercase tracking-wider shadow-sm">
              <Radio size={11} className="animate-pulse text-primary" />
              <span>AI Radar Signal Layer</span>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <ShieldCheck size={11} />
              <span>Primary Sources Only · Zero Hallucinations</span>
            </span>
          </div>

          {/* Telemetry pill replacing the dismiss button */}
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1 text-[11px] font-mono text-muted-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold uppercase text-[10px]">Surveillance Active</span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">24/7 Multi-Engine</span>
          </div>
        </div>

        {/* Main Headline & Synthesis */}
        <div className="space-y-2">
          <h2
            id="command-header-heading"
            className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight"
          >
            Cut through the noise. Understand the breakthroughs before the public.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Continuous multi-source surveillance across academic preprints, frontier model weights, open-source repositories, and developer automation — synthesized into actionable plain-English intelligence.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs">
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
        <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
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

            {isAuthenticated ? (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <SlidersHorizontal size={13} />
                <span>Customize Signal Filters</span>
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 px-3.5 py-2.5 text-xs font-semibold text-primary transition-all"
              >
                <Sparkles size={13} />
                <span>Create Free Radar Account</span>
              </Link>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground/70 font-mono">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Integrity Verified · High Confidence</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Named alias for cleaner domain semantics
export const ExecutiveCommandHeader = HeroWelcomeBanner;
