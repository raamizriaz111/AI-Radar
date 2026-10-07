import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Zap, ArrowRight, Clock, Bell, Sparkles, BookOpen } from 'lucide-react';
import type { DailyBriefingRow } from '@/lib/database.types';

interface ExecutiveBriefingSpotlightProps {
  briefing: DailyBriefingRow | null;
  className?: string;
}

export function ExecutiveBriefingSpotlight({
  briefing,
  className = '',
}: ExecutiveBriefingSpotlightProps) {
  if (!briefing) return null;

  let formattedDate = 'Today';
  try {
    formattedDate = format(new Date(briefing.briefing_date), 'EEEE, MMMM d, yyyy');
  } catch {
    formattedDate = briefing.briefing_date || 'Today';
  }

  return (
    <section
      aria-labelledby="executive-briefing-heading"
      className={`relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/30 via-card to-card p-5 sm:p-6 backdrop-blur-md shadow-md ${className}`}
    >
      {/* Decorative subtle background illumination */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3.5">
        {/* Top Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400">
              <Zap size={13} className="text-indigo-400" />
            </span>
            <h2
              id="executive-briefing-heading"
              className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono"
            >
              5-Minute Executive Briefing
            </h2>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>{formattedDate}</span>
            <span className="text-white/20">·</span>
            <span className="inline-flex items-center gap-1 rounded bg-secondary/80 px-2 py-0.5 text-foreground/80 font-medium">
              <Clock size={11} className="text-indigo-400" />
              5 min read
            </span>
          </div>
        </div>

        {/* Briefing Title and Executive Synthesis */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            <Link href="/briefing" className="hover:text-indigo-300 transition-colors">
              {briefing.title}
            </Link>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
            {briefing.summary}
          </p>
        </div>

        {/* Action & Subscription Value Prop */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <Link
            href="/briefing"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm shadow-indigo-600/20 active:scale-98 w-full sm:w-auto"
          >
            <BookOpen size={13} />
            <span>Read Complete Executive Briefing</span>
            <ArrowRight size={12} />
          </Link>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-indigo-300 transition-colors self-center sm:self-auto"
          >
            <Bell size={11} className="text-indigo-400" />
            <span>Delivered via email to Pro subscribers daily at 7:00 AM</span>
            <span className="underline font-medium">Learn more →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
