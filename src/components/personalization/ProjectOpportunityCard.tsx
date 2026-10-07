'use client';

import { useState } from 'react';
import { ProjectOpportunity, ProjectOpportunityStatus } from '@/lib/personalization/types';
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  X,
  AlertTriangle,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectOpportunityCardProps {
  opportunity: ProjectOpportunity;
  onStatusChange?: (slug: string, status: ProjectOpportunityStatus, notes?: string) => void;
  className?: string;
}

export function ProjectOpportunityCard({
  opportunity,
  onStatusChange,
  className,
}: ProjectOpportunityCardProps) {
  const [status, setStatus] = useState<ProjectOpportunityStatus>(opportunity.userStatus);
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(opportunity.userNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const difficultyColors: Record<string, string> = {
    small: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    large: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const handleStatusUpdate = async (newStatus: ProjectOpportunityStatus) => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(opportunity.slug, newStatus, notes);
    } else {
      try {
        await fetch('/api/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: opportunity.slug, status: newStatus, userNotes: notes }),
        });
      } catch (err) {
        console.error('Failed to update project status', err);
      }
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: opportunity.slug, status, userNotes: notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setSavingNotes(false);
    }
  };

  if (status === 'dismissed') {
    return null;
  }

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card p-5 transition-colors hover:border-border/80',
        status === 'in_progress' && 'border-primary/40 bg-primary/[0.015]',
        status === 'built' && 'border-emerald-500/40 bg-emerald-500/[0.015]',
        className
      )}
    >
      {/* Top Header */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium uppercase tracking-wider',
              difficultyColors[opportunity.difficulty] || 'bg-muted text-muted-foreground'
            )}
          >
            {opportunity.difficulty} Project
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            Target: {opportunity.targetUser}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === 'in_progress' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> In Progress
            </span>
          )}
          {status === 'built' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 size={12} /> Built
            </span>
          )}
          {status === 'saved' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400">
              <Bookmark size={12} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-base font-semibold text-foreground">
        {opportunity.title}
      </h3>

      {/* Problem & Solution Grid */}
      <div className="mb-3 space-y-2 text-xs">
        <div className="rounded-md border border-border/70 bg-muted/20 p-2.5">
          <p className="font-medium text-foreground mb-1">Observed Developer / User Pain Point:</p>
          <p className="text-muted-foreground leading-relaxed">{opportunity.problemStatement}</p>
        </div>
        <div className="rounded-md border border-border/70 bg-muted/20 p-2.5">
          <p className="font-medium text-foreground mb-1">Proposed Concrete Deliverable:</p>
          <p className="text-muted-foreground leading-relaxed">{opportunity.proposedSolution}</p>
        </div>
      </div>

      {/* Why Now */}
      <p className="mb-3 text-xs text-muted-foreground italic leading-relaxed">
        <span className="font-medium not-italic text-foreground/90">Why now: </span>
        {opportunity.whyNow}
      </p>

      {/* Skills Comparison */}
      <div className="mb-3.5 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground/80 mr-1">Skills You Have:</span>
          {opportunity.skillsMatched.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic">None from profile yet</span>
          ) : (
            opportunity.skillsMatched.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
              >
                <Check size={10} /> {skill}
              </span>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground/80 mr-1">Skills To Learn:</span>
          {opportunity.skillsToLearn.length === 0 ? (
            <span className="text-[11px] text-emerald-400 font-medium">Ready to build! Complete skill match.</span>
          ) : (
            opportunity.skillsToLearn.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400"
              >
                <Wrench size={10} /> {skill}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Tech Stack Pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {opportunity.technicalStack.map((tech) => (
          <span
            key={tech}
            className="rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <Layers size={13} />
          <span>Implementation Plan & Caveats</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <div className="flex items-center gap-1.5">
          {status !== 'in_progress' && status !== 'built' && (
            <button
              onClick={() => handleStatusUpdate('in_progress')}
              className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Briefcase size={12} /> Start Project
            </button>
          )}
          {status === 'in_progress' && (
            <button
              onClick={() => handleStatusUpdate('built')}
              className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle2 size={12} /> Mark Built
            </button>
          )}
          {status !== 'saved' && (
            <button
              onClick={() => handleStatusUpdate('saved')}
              className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Save project"
            >
              <Bookmark size={12} /> Save
            </button>
          )}
          <button
            onClick={() => handleStatusUpdate('dismissed')}
            className="rounded p-1 text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent transition-colors"
            title="Dismiss project idea"
            aria-label="Dismiss project idea"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Expanded Details: Implementation Milestones, Caveats, Notes */}
      {expanded && (
        <div className="mt-4 space-y-4 pt-3 border-t border-border/60 text-xs">
          {/* Milestones */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Implementation Milestones</h4>
            <div className="space-y-2">
              {opportunity.implementationSteps.map((step) => (
                <div key={step.step} className="rounded border border-border/60 bg-muted/15 p-2.5">
                  <span className="font-medium text-foreground block mb-0.5">
                    Step {step.step}: {step.title}
                  </span>
                  <p className="text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Challenges */}
          <div>
            <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1 text-amber-400">
              <AlertTriangle size={13} /> Potential Engineering Challenges & Feasibility
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              {opportunity.potentialChallenges.map((challenge, idx) => (
                <li key={idx}>{challenge}</li>
              ))}
            </ul>
          </div>

          {/* Supporting Items */}
          {opportunity.evidenceItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1.5">Supporting Source Evidence</h4>
              <div className="space-y-1">
                {opportunity.evidenceItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded border border-border/50 bg-muted/20 px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="flex items-center gap-1 text-[11px] text-primary flex-shrink-0">
                      {item.sourceName} <ExternalLink size={10} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          <div className="pt-2 border-t border-border/40">
            <label className="block font-semibold text-foreground mb-1">
              Personal Engineering Notes:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your architecture thoughts, repo links, or status notes..."
                className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="rounded border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {notesSaved ? 'Saved!' : savingNotes ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
