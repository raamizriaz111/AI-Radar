'use client';

import { useState } from 'react';
import { CareerSignal } from '@/lib/personalization/types';
import { ChevronDown, ChevronUp, ExternalLink, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CareerSignalCardProps {
  signal: CareerSignal;
  className?: string;
}

export function CareerSignalCard({ signal, className }: CareerSignalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const signalTypeLabels: Record<string, { label: string; color: string }> = {
    architectural_shift: { label: 'Architectural Shift', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    emerging_role: { label: 'Emerging Role', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    workflow_shift: { label: 'Workflow Shift', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    increasing_demand: { label: 'Increasing Demand', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  };

  const strengthLabels: Record<string, { label: string; dot: string }> = {
    strong: { label: 'Strong Signal (Multi-source)', dot: 'bg-emerald-400' },
    moderate: { label: 'Moderate Signal', dot: 'bg-amber-400' },
    emerging: { label: 'Early Signal', dot: 'bg-blue-400' },
  };

  const typeConfig = signalTypeLabels[signal.signalType] || {
    label: signal.signalType,
    color: 'bg-muted text-muted-foreground border-border',
  };

  const strengthConfig = strengthLabels[signal.strength] || {
    label: signal.strength,
    dot: 'bg-muted-foreground',
  };

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80',
        className
      )}
    >
      {/* Top badges */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium', typeConfig.color)}>
            {typeConfig.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {signal.roleOrDomain}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', strengthConfig.dot)} />
          <span>{strengthConfig.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        {signal.title}
      </h3>

      {/* Description */}
      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        {signal.description}
      </p>

      {/* Why it matters */}
      {signal.whyItMatters && (
        <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <div className="flex items-start gap-1.5 text-xs text-foreground/90 leading-relaxed">
            <Zap size={14} className="mt-0.5 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">Why it matters: </span>
              {signal.whyItMatters}
            </div>
          </div>
        </div>
      )}

      {/* Skills & Tech tags */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {signal.skills.map((skill) => (
          <span
            key={skill}
            className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
          >
            Skill: {skill}
          </span>
        ))}
        {signal.technologies.map((tech) => (
          <span
            key={tech}
            className="rounded border border-border bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground font-mono"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Evidence toggle */}
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Supporting Evidence ({signal.evidenceItems.length} items)</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
          <ShieldAlert size={10} /> Non-prescriptive observation
        </span>
      </div>

      {/* Expanded Evidence List */}
      {expanded && (
        <div className="mt-3 space-y-2 pt-2 border-t border-border/50">
          <p className="text-[11px] font-medium text-muted-foreground">Observed Source Items:</p>
          {signal.evidenceItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Evidence aggregated across general intelligence corpus.</p>
          ) : (
            <div className="space-y-1.5">
              {signal.evidenceItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate text-foreground/90 font-medium">{item.title}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline flex-shrink-0"
                  >
                    <span>{item.sourceName}</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {signal.supportingTrends.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-medium text-muted-foreground">Related Trends:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {signal.supportingTrends.map((trend) => (
                  <span
                    key={trend.id}
                    className="inline-flex items-center rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-400"
                  >
                    {trend.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
