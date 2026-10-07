'use client';

import { useState } from 'react';
import { Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalRelevanceBadgeProps {
  score: number;
  reasons: string[];
  className?: string;
}

export function PersonalRelevanceBadge({
  score,
  reasons,
  className,
}: PersonalRelevanceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (score <= 20) return null;

  const isHigh = score >= 60;
  const isModerate = score >= 35 && score < 60;

  const badgeColor = isHigh
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    : isModerate
    ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    : 'border-border bg-muted/40 text-muted-foreground';

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:brightness-110',
          badgeColor
        )}
        title="Click to view explainable relevance reasons"
      >
        <Sparkles size={10} />
        <span>{score}% For You</span>
        <Info size={9} className="opacity-60" />
      </button>

      {/* Explainable reasons popup */}
      {showTooltip && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-card p-2.5 shadow-xl text-left text-xs">
          <p className="font-semibold text-foreground mb-1 flex items-center justify-between">
            <span>Relevance Breakdown</span>
            <span className="font-mono text-primary">{score}/100</span>
          </p>
          <ul className="space-y-1 text-muted-foreground text-[11px]">
            {reasons.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-primary">•</span>
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
