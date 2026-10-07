'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePulseBarProps {
  totalItems: number;
  sourcesCount: number;
  lastUpdatedDate?: string;
  className?: string;
}

export function LivePulseBar({
  totalItems,
  sourcesCount,
  lastUpdatedDate,
  className,
}: LivePulseBarProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleSync() {
    setIsSyncing(true);
    setSyncStatus('idle');
    setMessage('');

    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'world-ai-news' }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSyncStatus('success');
        const created = data.result?.itemsCreated ?? 0;
        setMessage(created > 0 ? `Synced! +${created} new stories ingested.` : 'Feed up to date.');
        router.refresh();
      } else {
        setSyncStatus('error');
        setMessage(data.error || 'Sync failed.');
      }
    } catch {
      setSyncStatus('error');
      setMessage('Network error during sync.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-card/70 px-4 py-3 backdrop-blur-md',
        'shadow-sm',
        className
      )}
    >
      {/* Left: Status & Pulse */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            LIVE RADAR
          </span>
        </div>

        <span className="hidden text-white/20 sm:inline" aria-hidden="true">|</span>

        <p className="truncate text-xs text-foreground/80">
          <strong className="font-semibold text-foreground">{totalItems}</strong> verified developments across{' '}
          <span className="text-muted-foreground">{sourcesCount} global sources</span>
        </p>
      </div>

      {/* Right: Actions & Timestamp */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {syncStatus === 'success' && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 animate-in fade-in">
            <CheckCircle2 size={12} />
            <span>{message}</span>
          </span>
        )}

        {syncStatus === 'error' && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400 animate-in fade-in max-w-[280px] sm:max-w-sm truncate" title={message}>
            <AlertCircle size={12} className="flex-shrink-0" />
            <span className="truncate">{message}</span>
          </span>
        )}

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-all',
            'hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          <RefreshCw size={12} className={cn('text-primary', isSyncing && 'animate-spin')} />
          <span>{isSyncing ? 'Syncing Feeds…' : 'Sync Latest'}</span>
        </button>
      </div>
    </div>
  );
}
