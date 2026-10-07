'use client';

// =============================================================================
// AI Radar — Senior Executive Hero Welcome Banner
// =============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, X, Radio, BookOpen } from 'lucide-react';

interface HeroWelcomeBannerProps {
  isAuthenticated?: boolean;
}

export function HeroWelcomeBanner({ isAuthenticated = false }: HeroWelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // If visitor previously dismissed, hide it
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
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.08] via-indigo-950/20 to-card p-6 md:p-8 backdrop-blur-xl shadow-xl shadow-black/30">
      {/* Background glow radial */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        title="Dismiss introduction"
        className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground/60 hover:bg-white/[0.06] hover:text-foreground transition-colors"
        aria-label="Dismiss banner"
      >
        <X size={15} />
      </button>

      <div className="relative z-10 max-w-3xl space-y-4">
        {/* Top Badges Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary font-mono uppercase tracking-wider">
            <Radio size={11} className="animate-pulse" />
            <span>AI Radar Signal Layer</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <ShieldCheck size={11} />
            <span>Primary Sources Only · Zero Hallucinations</span>
          </span>
        </div>

        {/* Main Headline */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Cut through the noise. Understand the breakthroughs before the public.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            We track academic papers, frontier model weights, and developer tooling in real time — synthesizing complex technical shifts into plain English so you always know what is real, what matters, and what to build next.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <span className="font-semibold text-foreground block mb-0.5 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              Plain English Summaries
            </span>
            <span className="text-[11px] text-muted-foreground leading-normal block">
              No PhD required. Understand real-world impacts and implications in seconds.
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <span className="font-semibold text-foreground block mb-0.5 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              Verified Citations
            </span>
            <span className="text-[11px] text-muted-foreground leading-normal block">
              Every single claim links directly to official arXiv papers, code repos, or docs.
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <span className="font-semibold text-foreground block mb-0.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              Forward Horizon
            </span>
            <span className="text-[11px] text-muted-foreground leading-normal block">
              Track upcoming model releases, EU regulations, and ecosystem deadlines.
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/briefing"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
          >
            <BookOpen size={13} />
            <span>Read Today&apos;s 5-Min Executive Briefing</span>
            <ArrowRight size={12} />
          </Link>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
            >
              <span>Instant 1-Click Demo Access</span>
            </Link>
          )}

          <button
            onClick={handleDismiss}
            className="text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors ml-auto hidden sm:inline-block"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
