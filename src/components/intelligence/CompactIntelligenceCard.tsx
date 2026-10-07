'use client';

// =============================================================================
// AI Radar — Senior Executive Compact Scan Card (Editorial Skim Mode)
// =============================================================================

import React, { useState } from 'react';
import { ExternalLink, Bookmark, BookmarkCheck, BookmarkX, Clock, Share2, Check, Lock, Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type IntelligenceItemWithSummary } from '@/lib/types';
import { CategoryBadge } from './CategoryBadge';
import { CardBlueprintDrawer } from './CardBlueprintDrawer';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { useBookmarkStatus } from '@/lib/hooks/useBookmarkStatus';
import { cn } from '@/lib/utils';

interface CompactIntelligenceCardProps {
  item: IntelligenceItemWithSummary;
  onBookmark?: (id: string) => void;
  className?: string;
}

function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function CompactIntelligenceCard({
  item,
  onBookmark,
  className,
}: CompactIntelligenceCardProps) {
  const [copied, setCopied] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const { isFree } = useCurrentPlan();
  const { isBookmarked, handleToggle, isHovered, setIsHovered } = useBookmarkStatus(item, onBookmark);

  let relativeTime = '';
  try {
    const publishedDate = new Date(item.publishedAt);
    relativeTime = formatDistanceToNow(publishedDate, { addSuffix: true });
  } catch {
    relativeTime = 'Recently';
  }

  const domain = extractDomain(item.canonicalUrl) || extractDomain(item.sourceUrl);
  const publisherName = item.author || item.sourceName || domain;
  const punchline =
    item.summary?.content || item.description || 'Verified AI development collected from primary source.';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-card/60 px-4 py-3 transition-all duration-150 backdrop-blur-sm',
        'hover:border-white/20 hover:bg-card/90 hover:shadow-md',
        className
      )}
    >
      {/* Main Content Area */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Source metadata row */}
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[180px] sm:max-w-[260px]">{publisherName}</span>
          </span>

          <span className="text-white/20">·</span>

          {item.categories.slice(0, 1).map((cat) => (
            <CategoryBadge key={cat} category={cat} className="text-[9px] py-0" />
          ))}

          <span className="text-white/20">·</span>

          <span className="text-muted-foreground/70 font-mono tabular-nums">
            {relativeTime}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
          <a
            href={item.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none"
          >
            {item.title}
          </a>
        </h4>

        {/* 1-Line Plain English Punchline */}
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
          {punchline}
        </p>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center border-t sm:border-t-0 border-white/[0.04] pt-2 sm:pt-0 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={handleCopyLink}
          title="Copy link"
          aria-label="Copy link"
          className="rounded-lg p-2 min-h-[34px] min-w-[34px] flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
        </button>

        <button
          type="button"
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={isBookmarked ? 'Unsave this story (remove bookmark)' : 'Save bookmark'}
          aria-label={isBookmarked ? 'Unsave story' : 'Save story'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 min-h-[34px] text-[11px] font-medium transition-all duration-150',
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
                <BookmarkX size={13} className="text-rose-400" />
                <span className="text-[11px] text-rose-400">Unsave</span>
              </>
            ) : (
              <>
                <BookmarkCheck size={13} className="text-primary" />
                <span className="text-[11px] text-primary">Saved</span>
              </>
            )
          ) : (
            <>
              <Bookmark size={13} />
              <span className="text-[11px] text-muted-foreground">Save</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setBlueprintOpen(!blueprintOpen)}
          title={isFree ? "View Architecture Blueprint & Implementation Spec (Pro/Advanced)" : "View Unlocked Architecture Blueprint & Spec"}
          aria-label="Toggle architecture blueprint"
          className={cn(
            'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 min-h-[34px] text-[11px] font-mono transition-all',
            blueprintOpen
              ? 'bg-primary text-primary-foreground font-bold shadow-sm'
              : isFree
              ? 'border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:border-primary/40 hover:text-foreground'
              : 'border border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 font-bold'
          )}
        >
          {isFree ? <Lock size={11} className="text-muted-foreground" /> : <Terminal size={12} className="text-purple-400" />}
          <span>Spec</span>
        </button>

        <a
          href={item.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Read original source"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-secondary/50 px-3 py-1.5 min-h-[34px] text-[11px] font-medium text-foreground/90 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          <span>Read</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Slide-out Architecture Blueprint & Implementation Spec Drawer */}
      <CardBlueprintDrawer item={item} isOpen={blueprintOpen} onClose={() => setBlueprintOpen(false)} />
    </article>
  );
}
