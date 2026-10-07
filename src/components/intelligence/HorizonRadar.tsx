'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { type HorizonEvent } from '@/lib/intelligence/horizonService';
import { cn } from '@/lib/utils';

interface HorizonRadarProps {
  events: HorizonEvent[];
  compact?: boolean;
}

export function HorizonRadar({ events, compact = false }: HorizonRadarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Upcoming' },
    { id: 'model_drop', label: 'Next-Gen Models' },
    { id: 'regulation', label: 'Safety & Laws' },
    { id: 'product', label: 'Products' },
    { id: 'developer_event', label: 'Events' },
  ];

  const filtered = selectedCategory === 'all'
    ? events
    : events.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Category Filter Pills */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium transition-all',
                selectedCategory === cat.id
                  ? 'bg-primary/20 text-primary border border-primary/40 shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground border border-white/[0.05] hover:border-white/15 hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Horizon Cards */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          const statusBadge =
            item.status === 'Confirmed'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : item.status === 'Expected'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

          return (
            <div
              key={item.id}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className={cn(
                'group relative rounded-xl border border-white/[0.07] bg-card/60 p-4 transition-all cursor-pointer',
                'hover:border-white/20 hover:bg-card/90 hover:shadow-lg hover:shadow-black/40',
                isExpanded && 'border-primary/40 bg-card/95 ring-1 ring-primary/20'
              )}
            >
              {/* Header row */}
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                    {item.organization}
                  </span>
                  <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-medium', statusBadge)}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <Clock size={11} className="text-primary/70" />
                  <span>{item.expectedTimeframe}</span>
                </div>
              </div>

              {/* Title */}
              <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1.5">
                {item.title}
              </h4>

              {/* Summary */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {item.summary}
              </p>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3.5 space-y-2.5 border-t border-white/[0.08] pt-3 text-xs animate-in fade-in duration-200">
                  <div className="rounded-lg bg-primary/[0.06] border border-primary/20 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                      Why This Matters
                    </p>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {item.whyItMatters}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer action hint */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/60 border-t border-white/[0.04] pt-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/50">
                  {item.categoryLabel}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-primary/80 group-hover:text-primary transition-colors font-medium">
                  {isExpanded ? 'Show less' : 'View preview'}
                  <ChevronRight size={11} className={cn('transition-transform', isExpanded && 'rotate-90')} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
