'use client';

// =============================================================================
// AI Radar — Senior Executive Stream View with Feed Density Switcher
// =============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  List,
  LayoutGrid,
  Filter,
  ArrowRight,
  Radar,
  SlidersHorizontal,
  Newspaper,
  Wrench,
  Bot,
  FlaskConical,
  Shield,
  LucideIcon,
} from 'lucide-react';
import { type IntelligenceItemWithSummary } from '@/lib/types';
import { IntelligenceCard } from './IntelligenceCard';
import { CompactIntelligenceCard } from './CompactIntelligenceCard';
import { EmptyState } from './EmptyState';
import { saveStoryBookmark, removeStoryBookmark } from '@/lib/bookmarks/clientBookmarks';
import { cn } from '@/lib/utils';

export const EMPTY_ICON_MAP = {
  newspaper: Newspaper,
  wrench: Wrench,
  bot: Bot,
  flask: FlaskConical,
  shield: Shield,
  radar: Radar,
};

export type EmptyIconName = keyof typeof EMPTY_ICON_MAP;

export interface IntelligenceStreamViewProps {
  initialItems: IntelligenceItemWithSummary[];
  totalCount?: number;
  title?: string;
  description?: string;
  showCategoryFilter?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIconName?: EmptyIconName;
  emptyIcon?: LucideIcon;
  showFullStreamLink?: boolean;
}

type DensityMode = 'compact' | 'expanded';
type CategoryFilter = 'all' | 'ai-news' | 'ai-tools' | 'research' | 'coding-agents' | 'safety-regulation';

export function IntelligenceStreamView({
  initialItems,
  totalCount = initialItems.length,
  title = 'Latest Verified AI Developments',
  description = 'Continuous stream of peer-reviewed papers, tool drops, and frontier model shifts.',
  showCategoryFilter = true,
  emptyTitle = 'No intelligence items in this category',
  emptyDescription = 'Switch category filters to view active developments across research, news, and tools.',
  emptyIconName,
  emptyIcon,
  showFullStreamLink = true,
}: IntelligenceStreamViewProps) {
  const [density, setDensity] = useState<DensityMode>('compact');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [items, setItems] = useState<IntelligenceItemWithSummary[]>(initialItems);

  const ResolvedEmptyIcon = emptyIconName
    ? EMPTY_ICON_MAP[emptyIconName]
    : emptyIcon || Radar;

  // Read saved preference from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedDensity = window.localStorage.getItem('ai_radar_density_pref') as DensityMode;
        if (savedDensity === 'compact' || savedDensity === 'expanded') {
          setDensity(savedDensity);
        }
      }
    } catch {}
  }, []);

  const handleDensityChange = (mode: DensityMode) => {
    setDensity(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ai_radar_density_pref', mode);
      }
    } catch {}
  };

  const handleBookmarkToggle = async (id: string) => {
    const target = items.find((i) => i.id === id);
    const willBeBookmarked = !target?.isBookmarked;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: willBeBookmarked } : item
      )
    );

    try {
      if (willBeBookmarked && target) {
        await saveStoryBookmark({ ...target, isBookmarked: true });
      } else {
        await removeStoryBookmark(id);
      }
    } catch (err) {
      console.warn('Bookmark toggle sync warning', err);
    }
  };

  // Filter items by category if category filter is enabled
  const filteredItems = items.filter((item) => {
    if (!showCategoryFilter || selectedCategory === 'all') return true;
    return item.categories.includes(selectedCategory as any);
  });

  return (
    <div className="space-y-4">
      {/* Stream Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-3">
        {/* Title and Count */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
              {filteredItems.length} of {totalCount}
            </span>
          </div>
          {description && (
            <p className="text-[11px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Density Switcher */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-secondary/50 p-0.5">
            <button
              onClick={() => handleDensityChange('compact')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                density === 'compact'
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Compact scan mode (read 10+ stories in seconds)"
            >
              <List size={13} />
              <span className="text-[11px]">Compact</span>
            </button>

            <button
              onClick={() => handleDensityChange('expanded')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                density === 'expanded'
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Expanded analytical deep-dive mode"
            >
              <LayoutGrid size={13} />
              <span className="text-[11px]">Expanded</span>
            </button>
          </div>

          {showFullStreamLink && (
            <Link
              href="/news"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-1"
            >
              <span>Full Stream</span>
              <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Filter Pill Chips */}
      {showCategoryFilter && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: 'All Intelligence' },
            { id: 'ai-news', label: 'News & Releases' },
            { id: 'ai-tools', label: 'Tools & Apps' },
            { id: 'research', label: 'Frontier Research' },
            { id: 'coding-agents', label: 'Coding Agents' },
            { id: 'safety-regulation', label: 'Safety & Policy' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id as CategoryFilter)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                selectedCategory === chip.id
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-white/[0.04]'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Stories Stream */}
      {filteredItems.length > 0 ? (
        <div className={cn(density === 'compact' ? 'space-y-2' : 'space-y-3.5')}>
          {filteredItems.map((item) =>
            density === 'compact' ? (
              <CompactIntelligenceCard
                key={item.id}
                item={item}
                onBookmark={handleBookmarkToggle}
              />
            ) : (
              <IntelligenceCard
                key={item.id}
                item={item}
                onBookmark={handleBookmarkToggle}
              />
            )
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-card p-8">
          <EmptyState
            icon={ResolvedEmptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              selectedCategory !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <Filter size={12} />
                  <span>Show All Categories</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Radar size={13} />
                    <span>Browse Live Intelligence</span>
                  </Link>
                  <Link
                    href="/briefing"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-secondary/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Read Today&apos;s Briefing</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
