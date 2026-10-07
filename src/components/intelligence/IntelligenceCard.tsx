'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  BookmarkX,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  ShieldCheck,
  Building2,
  Cpu,
  Lock,
  Terminal,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { type IntelligenceItemWithSummary } from '@/lib/types';
import { CategoryBadge } from './CategoryBadge';
import { CardBlueprintDrawer } from './CardBlueprintDrawer';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { useBookmarkStatus } from '@/lib/hooks/useBookmarkStatus';
import { cn } from '@/lib/utils';

interface IntelligenceCardProps {
  item: IntelligenceItemWithSummary;
  onBookmark?: (id: string) => void;
  className?: string;
  featured?: boolean;
}

/**
 * Extracts clean domain name for publisher branding
 */
function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function IntelligenceCard({
  item,
  onBookmark,
  className,
  featured = false,
}: IntelligenceCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const { isFree } = useCurrentPlan();
  const { isBookmarked, handleToggle, isHovered, setIsHovered } = useBookmarkStatus(item, onBookmark);

  let relativeTime = '';
  let isRecent = false;

  try {
    const publishedDate = new Date(item.publishedAt);
    const diffHours = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
    isRecent = diffHours <= 6 && diffHours >= 0;
    relativeTime = formatDistanceToNow(publishedDate, { addSuffix: true });
  } catch {
    relativeTime = 'Recently';
  }

  const summary = item.summary;
  const domain = extractDomain(item.canonicalUrl) || extractDomain(item.sourceUrl);
  const publisherName = item.author || item.sourceName || domain;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-white/[0.07] bg-card/75 p-5 transition-all duration-200 backdrop-blur-sm',
        'hover:border-white/20 hover:bg-card/95 hover:shadow-xl hover:shadow-black/30',
        featured && 'border-primary/30 bg-gradient-to-b from-primary/[0.08] via-card to-card p-6 md:p-7 shadow-lg shadow-black/40',
        className
      )}
    >
      <div>
        {/* Header: Publisher info, category pills, and timestamps */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Publisher Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="truncate max-w-[220px] sm:max-w-[280px]">{publisherName}</span>
            </div>

            {/* Category */}
            {item.categories.slice(0, 2).map((cat) => (
              <CategoryBadge key={cat} category={cat} />
            ))}

            {isRecent && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                Fresh
              </span>
            )}
          </div>

          {/* Time indicator */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <Clock size={11} className="text-muted-foreground/60" />
            <span>{relativeTime}</span>
          </div>
        </div>

        {/* Headline */}
        <h3
          className={cn(
            'font-semibold text-foreground leading-snug tracking-tight transition-colors group-hover:text-primary mb-2',
            featured ? 'text-lg sm:text-xl font-bold text-foreground/95' : 'text-[15px]'
          )}
        >
          <a
            href={item.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none"
          >
            {item.title}
          </a>
        </h3>

        {/* Source description preview */}
        {item.description && (
          <p
            className={cn(
              'text-xs text-muted-foreground leading-relaxed mb-3.5',
              featured ? 'line-clamp-3 text-[13px] text-muted-foreground/90' : 'line-clamp-2'
            )}
          >
            {item.description}
          </p>
        )}

        {/* AI Plain-English Summary Drawer */}
        {summary && (
          <div className="mb-3.5 overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} className="text-primary animate-pulse-dot" />
                <span>Executive Summary</span>
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                Verified Facts
              </span>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed">
              {summary.content}
            </p>

            {/* Toggle deeper insights */}
            {summary.significance && (
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <span>{showAnalysis ? 'Hide' : 'Why this matters in the real world'}</span>
                  {showAnalysis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showAnalysis && (
                  <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-200">
                    <div className="rounded-lg bg-secondary/50 border border-white/[0.06] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                        Real-World Impact
                      </p>
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {summary.significance}
                      </p>
                    </div>

                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Key Facts
                        </p>
                        <ul className="space-y-1">
                          {summary.keyPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="h-1 w-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
        <div className="flex items-center gap-1">
          {/* Share / Copy link */}
          <button
            onClick={handleCopyLink}
            title="Copy article link"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Bookmark / Unsave Button */}
          <button
            type="button"
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={isBookmarked ? 'Unsave this story (remove from reading list)' : 'Save story to reading list'}
            aria-label={isBookmarked ? 'Unsave story' : 'Save story'}
            className={cn(
              'group/bm flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
              isBookmarked
                ? isHovered
                  ? 'border border-rose-500/40 bg-rose-500/10 text-rose-400 font-semibold'
                  : 'border border-primary/30 bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {isBookmarked ? (
              isHovered ? (
                <>
                  <BookmarkX size={12} className="text-rose-400" />
                  <span className="text-rose-400">Unsave</span>
                </>
              ) : (
                <>
                  <BookmarkCheck size={12} className="text-primary" />
                  <span className="text-primary">Saved</span>
                </>
              )
            ) : (
              <>
                <Bookmark size={12} />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Blueprint & Spec Toggle */}
          <button
            type="button"
            onClick={() => setBlueprintOpen(!blueprintOpen)}
            title={isFree ? "View Architecture Blueprint & Implementation Spec (Pro/Advanced)" : "View Unlocked Architecture Blueprint & Spec"}
            aria-label="Toggle architecture blueprint"
            className={cn(
              'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono transition-all',
              blueprintOpen
                ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                : isFree
                ? 'border border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-primary/40 hover:text-foreground'
                : 'border border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 font-bold'
            )}
          >
            {isFree ? <Lock size={11} className="text-muted-foreground" /> : <Terminal size={12} className="text-purple-400" />}
            <span>Blueprint &amp; Spec</span>
          </button>
        </div>

        {/* Read Original Source Link */}
        <a
          href={item.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <span>Read Full Story</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Architecture Blueprint & Implementation Spec Drawer */}
      <CardBlueprintDrawer item={item} isOpen={blueprintOpen} onClose={() => setBlueprintOpen(false)} />
    </article>
  );
}
