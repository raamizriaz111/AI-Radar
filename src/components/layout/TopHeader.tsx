'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { SearchButton } from '@/components/intelligence/SearchButton';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { useAuthUser } from '@/lib/hooks/useAuthUser';

interface TopHeaderProps {
  title: string;
  description?: string;
}

export function TopHeader({ title, description }: TopHeaderProps) {
  const { isFree, isPro, isAdvanced } = useCurrentPlan();
  const { authenticated, loading } = useAuthUser();
  const [timeString, setTimeString] = useState<string>('');
  const [userTimeZone, setUserTimeZone] = useState<string>('');

  useEffect(() => {
    try {
      setUserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch {}

    const updateTime = () => {
      setTimeString(format(new Date(), 'EEE, MMM d · HH:mm:ss'));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hidden h-14 items-center justify-between border-b border-white/[0.07] bg-card/40 px-6 backdrop-blur-md lg:flex z-30 sticky top-0">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <span>{title}</span>
        </h1>
        {description && (
          <p className="truncate text-[11px] text-muted-foreground/80 leading-normal">{description}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-3 xl:gap-4 pl-4">
        {/* Guest: single clean "Sign in" — Members: dynamic tier badge */}
        {!loading && !authenticated ? (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-white/[0.07] hover:border-white/[0.14] transition-all"
          >
            Sign in
          </Link>
        ) : isAdvanced ? (
          <Link
            href="/pricing"
            className="hidden xl:flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 font-mono hover:bg-purple-500/25 transition-colors"
            title="Active Tier: Advanced ($20/mo) · Programmatic REST API, Code Blueprints & Push Webhooks Active"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>⚡ ADVANCED POWER CONSOLE</span>
          </Link>
        ) : isPro ? (
          <Link
            href="/pricing"
            className="hidden xl:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 font-mono hover:bg-blue-500/25 transition-colors"
            title="Active Tier: Pro ($10/mo) · 7:00 AM Executive Digest & Architecture Blueprints Unlocked"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>PRO SUBSCRIBER · 7:00 AM DIGEST</span>
          </Link>
        ) : (
          <Link
            href="/pricing"
            className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 font-mono hover:bg-emerald-500/10 transition-colors"
            title="Active Tier: Free ($0/mo) · Manual Web Dashboard · Click to manage plan"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>FREE TIER · MANUAL DASHBOARD</span>
          </Link>
        )}

        <SearchButton />

        <div className="h-4 w-px bg-white/[0.08]" aria-hidden="true" />

        <div
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono tabular-nums"
          title={userTimeZone ? `Live local time · ${userTimeZone}` : 'Live real-time local clock'}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span suppressHydrationWarning>
            {timeString || format(new Date(), 'EEE, MMM d · HH:mm:ss')}
          </span>
        </div>
      </div>
    </header>
  );
}
