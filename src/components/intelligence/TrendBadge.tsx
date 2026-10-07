// =============================================================================
// AI Radar — Trend Badges (Phase 5)
// =============================================================================

import React from 'react';
import { cn } from '@/lib/utils';
import type { TrendStatus, TrendConfidence } from '@/lib/database.types';

interface TrendStatusBadgeProps {
  status: TrendStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  early_signal: {
    label: 'Early Signal',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  developing: {
    label: 'Developing',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  established: {
    label: 'Established',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  uncertain: {
    label: 'Uncertain / Mixed',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  declining: {
    label: 'Declining',
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
  },
};

export function TrendStatusBadge({ status, className }: TrendStatusBadgeProps) {
  const norm = status.replace('-', '_');
  const config = statusConfig[norm] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface TrendConfidenceBadgeProps {
  confidence: TrendConfidence | string;
  score?: number;
  className?: string;
}

const confidenceConfig: Record<string, { label: string; className: string }> = {
  high: {
    label: 'High Confidence',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  medium: {
    label: 'Medium Confidence',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  low: {
    label: 'Low Confidence',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
};

export function TrendConfidenceBadge({ confidence, score, className }: TrendConfidenceBadgeProps) {
  const config = confidenceConfig[confidence.toLowerCase()] ?? {
    label: `${confidence} Confidence`,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium',
        config.className,
        className
      )}
      title={score !== undefined ? `Confidence Score: ${Math.round(score * 100)}%` : undefined}
    >
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-75">({Math.round(score * 100)}%)</span>
      )}
    </span>
  );
}
