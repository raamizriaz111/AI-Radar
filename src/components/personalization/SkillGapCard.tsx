'use client';

import { useState } from 'react';
import { SkillGap, SkillGapActionStatus } from '@/lib/personalization/types';
import { BookOpen, ExternalLink, CheckCircle2, Bookmark, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillGapCardProps {
  skillGap: SkillGap;
  onStatusChange?: (gapId: string, status: SkillGapActionStatus) => void;
  className?: string;
}

export function SkillGapCard({ skillGap, onStatusChange, className }: SkillGapCardProps) {
  const [currentStatus, setCurrentStatus] = useState<SkillGapActionStatus>(skillGap.userActionStatus);
  const [showLearningPath, setShowLearningPath] = useState(false);

  const gapTypeConfig: Record<string, { label: string; color: string }> = {
    untracked: { label: 'Untracked Skill', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    level_up: { label: 'Level-Up Opportunity', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    emerging: { label: 'Emerging Technique', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  };

  const typeConfig = gapTypeConfig[skillGap.gapType] || {
    label: skillGap.gapType,
    color: 'bg-muted text-muted-foreground border-border',
  };

  const handleAction = async (status: SkillGapActionStatus) => {
    setCurrentStatus(status);
    if (onStatusChange) {
      onStatusChange(skillGap.id, status);
    } else {
      try {
        await fetch('/api/career', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gapId: skillGap.id, status }),
        });
      } catch (err) {
        console.error('Failed to update gap status', err);
      }
    }
  };

  if (currentStatus === 'dismissed') {
    return null;
  }

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80',
        currentStatus === 'in_progress' && 'border-primary/40 bg-primary/[0.02]',
        className
      )}
    >
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium', typeConfig.color)}>
            {typeConfig.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {skillGap.skillCategory}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentStatus === 'in_progress' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> In Progress
            </span>
          ) : currentStatus === 'saved' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <Bookmark size={12} /> Saved
            </span>
          ) : null}
        </div>
      </div>

      {/* Skill Name */}
      <h3 className="mb-1 text-sm font-semibold text-foreground">
        {skillGap.skillName}
      </h3>

      {/* Relevance Reason */}
      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        {skillGap.relevanceReason}
      </p>

      {/* Supporting Evidence Items */}
      {skillGap.supportingItems.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Observed in recent intelligence:
          </p>
          <div className="space-y-1">
            {skillGap.supportingItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded border border-border/50 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <span className="truncate">{item.title}</span>
                <ExternalLink size={10} className="flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Learning Pathway toggle */}
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <button
          onClick={() => setShowLearningPath(!showLearningPath)}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <BookOpen size={13} />
          <span>Learning Pathway ({skillGap.learningPath.length} steps)</span>
          {showLearningPath ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {currentStatus !== 'in_progress' && (
            <button
              onClick={() => handleAction('in_progress')}
              className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Mark this skill as currently learning"
            >
              <CheckCircle2 size={11} /> Start
            </button>
          )}
          {currentStatus !== 'saved' && (
            <button
              onClick={() => handleAction('saved')}
              className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Save to review later"
            >
              <Bookmark size={11} /> Save
            </button>
          )}
          <button
            onClick={() => handleAction('dismissed')}
            className="rounded p-1 text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent transition-colors"
            title="Dismiss this recommendation"
            aria-label="Dismiss skill gap"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Progressive Learning Pathway Steps */}
      {showLearningPath && (
        <div className="mt-3 space-y-2 pt-2 border-t border-border/60">
          {skillGap.learningPath.map((step) => (
            <div key={step.step} className="rounded-md border border-border/60 bg-muted/15 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">
                  Step {step.step}: {step.title}
                </span>
                {step.resourceType && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase font-mono text-muted-foreground">
                    {step.resourceType}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
