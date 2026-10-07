'use client';

import { useState } from 'react';
import { LearningTopic } from '@/lib/personalization/types';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, Sparkles, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningTopicCardProps {
  topic: LearningTopic;
  className?: string;
}

export function LearningTopicCard({ topic, className }: LearningTopicCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {topic.category}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono">
          {topic.technologies.join(' · ')}
        </span>
      </div>

      <h3 className="mb-1 text-sm font-semibold text-foreground">
        {topic.title}
      </h3>

      <p className="mb-2.5 text-xs text-muted-foreground leading-relaxed">
        {topic.summary}
      </p>

      {/* Why Relevant */}
      <div className="mb-3 rounded border border-border/70 bg-muted/20 p-2 text-xs">
        <p className="text-foreground/90 leading-relaxed">
          <span className="font-medium text-foreground">Why learn this now: </span>
          {topic.whyRelevant}
        </p>
      </div>

      {/* Prerequisites */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-muted-foreground mr-1">Prerequisites:</span>
        {topic.prerequisites.map((req) => (
          <span
            key={req}
            className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-muted-foreground"
          >
            {req}
          </span>
        ))}
      </div>

      {/* Expand toggle */}
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <BookOpen size={13} />
          <span>Concepts & Hands-On Projects</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <span className="text-[10px] text-muted-foreground">
          {topic.relatedItems.length} linked papers/repos
        </span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 space-y-3 pt-2 border-t border-border/60 text-xs">
          {/* Key Concepts */}
          <div>
            <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1">
              <Sparkles size={12} className="text-primary" /> Key Concepts to Master
            </h4>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
              {topic.keyConcepts.map((concept, idx) => (
                <li key={idx}>{concept}</li>
              ))}
            </ul>
          </div>

          {/* Practical Projects */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1">
              <Code2 size={12} className="text-primary" /> Hands-On Project Milestones
            </h4>
            {topic.starterProject && (
              <div className="rounded border border-border/60 bg-muted/20 p-2">
                <span className="font-medium text-foreground block mb-0.5">Starter Project:</span>
                <p className="text-muted-foreground">{topic.starterProject}</p>
              </div>
            )}
            {topic.advancedProject && (
              <div className="rounded border border-border/60 bg-muted/20 p-2">
                <span className="font-medium text-foreground block mb-0.5">Advanced System:</span>
                <p className="text-muted-foreground">{topic.advancedProject}</p>
              </div>
            )}
          </div>

          {/* Related Items */}
          {topic.relatedItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Related Primary Sources</h4>
              <div className="space-y-1">
                {topic.relatedItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded border border-border/50 bg-muted/20 px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span className="truncate">{item.title}</span>
                    <ExternalLink size={10} className="flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
