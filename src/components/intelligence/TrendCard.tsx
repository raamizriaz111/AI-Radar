// =============================================================================
// AI Radar — Trend Card Component (Phase 5)
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Layers, Compass, ArrowRight } from 'lucide-react';
import type { TrendRow } from '@/lib/database.types';
import { TrendStatusBadge, TrendConfidenceBadge } from './TrendBadge';
import { cn } from '@/lib/utils';

interface TrendCardProps {
  trend: TrendRow;
  className?: string;
}

export function TrendCard({ trend, className }: TrendCardProps) {
  const technologies = Array.isArray(trend.technologies)
    ? (trend.technologies as string[])
    : [];

  const activityPct = trend.activity_change_pct ?? 0;

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-white/[0.08] bg-card/75 backdrop-blur-md p-5 transition-all hover:border-primary/40 hover:bg-card/90 shadow-sm',
        className
      )}
    >
      <div>
        {/* Top Badges */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <TrendStatusBadge status={trend.status} />
            <TrendConfidenceBadge
              confidence={trend.confidence}
              score={trend.confidence_score}
            />
          </div>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Layers size={12} />
            <span>{trend.distinct_source_count} source{trend.distinct_source_count === 1 ? '' : 's'}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          <Link href={`/trends/${trend.slug}`} className="hover:underline flex items-center gap-1">
            {trend.title}
          </Link>
        </h3>

        {/* Summary Description */}
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground line-clamp-3">
          {trend.summary || trend.description}
        </p>

        {/* Technologies / Keywords */}
        {technologies.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {technologies.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tech}
              </span>
            ))}
            {technologies.length > 5 && (
              <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5">
                +{technologies.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & CTA */}
      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span title="Total supporting items">
            <strong className="font-semibold text-foreground">{trend.item_count}</strong> items
          </span>
          {activityPct !== 0 && (
            <span
              className={cn(
                'flex items-center gap-0.5 font-medium',
                activityPct > 0 ? 'text-emerald-400' : 'text-zinc-400'
              )}
              title="Recent activity rate change"
            >
              <TrendingUp size={12} />
              {activityPct > 0 ? `+${activityPct}%` : `${activityPct}%`}
            </span>
          )}
        </div>

        <Link
          href={`/trends/${trend.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View Evidence <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}
