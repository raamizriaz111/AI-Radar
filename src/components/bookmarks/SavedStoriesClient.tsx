'use client';

// =============================================================================
// AI Radar — Saved Stories & Intelligence Portfolio Client Component
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  BookmarkCheck,
  BookmarkX,
  Search,
  ExternalLink,
  Trash2,
  Share2,
  Check,
  ArrowRight,
  Lock,
  CheckCircle2,
  Filter,
  Sparkles,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Layers,
  RotateCcw,
  X,
  Download,
  Copy,
  FileText,
  Code,
  BookOpen,
} from 'lucide-react';
import { IntelligenceItemWithSummary } from '@/lib/types';
import {
  getLocallySavedItems,
  saveStoryBookmark,
  removeStoryBookmark,
  subscribeToBookmarks,
} from '@/lib/bookmarks/clientBookmarks';
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard';
import { EmptyState } from '@/components/intelligence/EmptyState';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { cn } from '@/lib/utils';

interface SavedStoriesClientProps {
  initialBookmarkedItems: IntelligenceItemWithSummary[];
  initialSavedEntities: any[];
  isAuthenticated: boolean;
}

type FilterCategory = 'all' | 'news' | 'research' | 'tools' | 'coding' | 'entities';

function formatMarkdown(items: IntelligenceItemWithSummary[]): string {
  return [
    '# AI Radar — Saved Intelligence Bibliography',
    `*Generated on ${new Date().toLocaleDateString()} · ${items.length} citations*`,
    '',
    ...items.map(
      (it) =>
        `- **[${it.title}](${it.canonicalUrl})**\n  *${it.sourceName}* · Published: ${new Date(
          it.publishedAt
        ).toLocaleDateString()}${
          it.summary?.content ? `\n  > ${it.summary.content}` : ''
        }`
    ),
  ].join('\n\n');
}

function formatBibtex(items: IntelligenceItemWithSummary[]): string {
  return items
    .map((it, idx) => {
      const citeKey = `airadar_${it.sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${idx + 1}`;
      const year = new Date(it.publishedAt).getFullYear() || 2026;
      const cleanTitle = it.title.replace(/[{}]/g, '');
      const author = it.author ? it.author.replace(/[{}]/g, '') : it.sourceName;
      return `@article{${citeKey},
  title = {${cleanTitle}},
  author = {${author}},
  journal = {${it.sourceName}},
  year = {${year}},
  url = {${it.canonicalUrl}}
}`;
    })
    .join('\n\n');
}

function formatJson(items: IntelligenceItemWithSummary[]): string {
  return JSON.stringify(
    items.map((it) => ({
      id: it.id,
      title: it.title,
      canonicalUrl: it.canonicalUrl,
      sourceName: it.sourceName,
      publishedAt: it.publishedAt,
      categories: it.categories,
      author: it.author || null,
      summary: it.summary?.content || it.description || null,
    })),
    null,
    2
  );
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SavedStoriesClient({
  initialBookmarkedItems,
  initialSavedEntities,
  isAuthenticated,
}: SavedStoriesClientProps) {
  const { isFree, isPro, isAdvanced, displayName, switchPlan } = useCurrentPlan();
  const [items, setItems] = useState<IntelligenceItemWithSummary[]>(initialBookmarkedItems);
  const [entities, setEntities] = useState<any[]>(initialSavedEntities);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'bibtex' | 'json'>('markdown');
  const [copiedExport, setCopiedExport] = useState(false);
  const [switchingToTier, setSwitchingToTier] = useState<string | null>(null);
  const [lastRemovedItem, setLastRemovedItem] = useState<IntelligenceItemWithSummary | null>(null);

  // Hydrate & merge local storage saved stories on mount
  useEffect(() => {
    try {
      const localItems = getLocallySavedItems();
      if (localItems.length > 0) {
        setItems((currentItems) => {
          const idMap = new Map<string, IntelligenceItemWithSummary>();
          // Server items first
          currentItems.forEach((it) => idMap.set(it.id, it));
          // Merge local items
          localItems.forEach((it) => {
            if (!idMap.has(it.id)) {
              idMap.set(it.id, it);
            }
          });
          return Array.from(idMap.values());
        });
      }
    } catch (err) {
      console.warn('Could not read local saved items', err);
    }

    // Subscribe to cross-card unbookmarking / updates
    const unsubscribe = subscribeToBookmarks((detail) => {
      if (!detail.isBookmarked && detail.itemId) {
        setItems((prev) => prev.filter((it) => it.id !== detail.itemId));
      } else if (detail.isBookmarked && detail.itemId) {
        const local = getLocallySavedItems();
        setItems(local);
      }
    });

    return unsubscribe;
  }, []);

  const handleRemove = async (itemId: string) => {
    const target = items.find((it) => it.id === itemId);
    if (target) {
      setLastRemovedItem(target);
    }
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    await removeStoryBookmark(itemId);
  };

  const handleUndo = async () => {
    if (!lastRemovedItem) return;
    const itemToRestore = lastRemovedItem;
    setLastRemovedItem(null);
    setItems((prev) => [itemToRestore, ...prev.filter((it) => it.id !== itemToRestore.id)]);
    await saveStoryBookmark(itemToRestore);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to remove all saved stories?')) return;
    const currentIds = items.map((i) => i.id);
    setItems([]);
    for (const id of currentIds) {
      await removeStoryBookmark(id);
    }
  };

  const formattedExportContent = useMemo(() => {
    if (exportFormat === 'markdown') return formatMarkdown(items);
    if (exportFormat === 'bibtex') return formatBibtex(items);
    return formatJson(items);
  }, [items, exportFormat]);

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(formattedExportContent);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2500);
    } catch {}
  };

  const handleDownloadExport = () => {
    const filename = `airadar-portfolio-${new Date().toISOString().slice(0, 10)}`;
    if (exportFormat === 'markdown') {
      triggerDownload(formattedExportContent, `${filename}.md`, 'text/markdown');
    } else if (exportFormat === 'bibtex') {
      triggerDownload(formattedExportContent, `${filename}.bib`, 'application/x-bibtex');
    } else {
      triggerDownload(formattedExportContent, `${filename}.json`, 'application/json');
    }
  };

  const handleSandboxUpgrade = async (tier: 'pro' | 'advanced') => {
    setSwitchingToTier(tier);
    await switchPlan(tier);
    setSwitchingToTier(null);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesSource = item.sourceName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSource) return false;
      }

      // Category matching
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'news') return item.categories.includes('ai-news' as any);
      if (selectedFilter === 'research') return item.categories.includes('research' as any) || item.categories.includes('models' as any);
      if (selectedFilter === 'tools') return item.categories.includes('ai-tools' as any);
      if (selectedFilter === 'coding') return item.categories.includes('coding-agents' as any);
      return true;
    });
  }, [items, searchQuery, selectedFilter]);

  const totalSavedCount = items.length + entities.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Portfolio Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-white/[0.08] bg-card/60 p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-foreground">
              Saved Intelligence Portfolio
            </h2>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-primary">
              {totalSavedCount} Saved
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Curated reference library of primary papers, verified articles, and strategic signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {items.length > 0 && (
            <>
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground/90 hover:bg-secondary transition-colors"
                title="Export portfolio citations (Markdown, BibTeX, JSON)"
              >
                <Share2 size={12} />
                <span>Export Citations</span>
                {isFree ? (
                  <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-mono text-muted-foreground">PRO</span>
                ) : (
                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-mono text-emerald-400 font-bold">READY</span>
                )}
              </button>

              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove all saved stories"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            </>
          )}

          {!isAuthenticated ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
              <Lock size={12} />
              <span>Browser Saved</span>
              <span className="text-white/30">·</span>
              <Link href="/login" className="underline hover:text-amber-200">
                Sign in to sync across devices
              </Link>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <BookmarkCheck size={12} />
              <span>Cloud Synced to Account</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter saved stories by title, source, or keywords..."
              className="w-full rounded-lg border border-white/[0.08] bg-card/60 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'news', label: 'News' },
              { id: 'research', label: 'Research' },
              { id: 'tools', label: 'Tools' },
              { id: 'coding', label: 'Agents' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedFilter(chip.id as FilterCategory)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                  selectedFilter === chip.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1-Click Undo Recovery Toast */}
      {lastRemovedItem && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <BookmarkX size={15} className="text-rose-400 flex-shrink-0" />
            <span className="truncate">
              Removed &ldquo;<span className="font-semibold text-foreground">{lastRemovedItem.title}</span>&rdquo; from saved stories.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1 font-semibold text-rose-200 hover:bg-rose-500/30 hover:text-white transition-colors"
            >
              <RotateCcw size={12} />
              <span>Undo</span>
            </button>
            <button
              onClick={() => setLastRemovedItem(null)}
              className="p-1 text-rose-400 hover:text-rose-200 transition-colors"
              aria-label="Dismiss undo notification"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content View */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="group/saved flex flex-col">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-medium">
                    <CheckCircle2 size={11} /> Saved in Portfolio
                  </span>
                </div>
                <IntelligenceCard
                  item={{ ...item, isBookmarked: true }}
                  onBookmark={handleRemove}
                />
              </div>
            ))}
          </div>
        </div>
      ) : items.length > 0 && searchQuery ? (
        <div className="rounded-xl border border-white/[0.08] bg-card p-8 text-center">
          <p className="text-xs text-muted-foreground">
            No saved stories match your filter &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-primary underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-card/60 p-10 text-center">
          <EmptyState
            icon={Bookmark}
            title="Your saved reading list is currently empty."
            description="Click the 'Save' button on any story across Today's Radar, News, or Research to save it here for instant reference."
            action={
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                <span>Browse Today&apos;s Radar</span>
                <ArrowRight size={13} />
              </Link>
            }
          />
        </div>
      )}

      {/* Multi-Entity Saved Items (Trends, Projects, Topics) */}
      {entities.length > 0 && (
        <section className="pt-6 border-t border-white/[0.06]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Saved Trends, Projects & Learning Goals
            </h3>
            <span className="text-xs text-muted-foreground">
              {entities.length} tracked object{entities.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="rounded-xl border border-white/[0.08] bg-card/60 p-4 transition-all hover:border-white/20"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground font-mono">
                    {entity.entityType === 'trend' && <TrendingUp size={11} />}
                    {entity.entityType === 'project' && <Briefcase size={11} />}
                    {entity.entityType === 'learning_topic' && <GraduationCap size={11} />}
                    {entity.entityType}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(entity.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  {entity.title}
                </h4>
                {entity.notes && (
                  <p className="text-[11px] text-muted-foreground bg-accent/40 rounded p-2 mt-2">
                    {entity.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plan-Aware Citation & Bibliography Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-card p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close export dialog"
            >
              <X size={16} />
            </button>

            {isFree ? (
              /* Free Tier Gate Modal */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Lock size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Citation & Bibliography Export Suite
                      </h3>
                      <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300">
                        Pro & Advanced Feature
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Structured export to Markdown, BibTeX (.bib) for LaTeX/Overleaf, and JSON is unlocked for subscribers.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-secondary/30 p-4 space-y-2.5">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                    What Subscribers Can Export:
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-card/60 p-2.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                        <FileText size={13} />
                        <span>Markdown</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Clean hyperlinks and summaries ready for Obsidian, Notion & GitHub.
                      </p>
                    </div>
                    <div className="rounded-lg bg-card/60 p-2.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
                        <BookOpen size={13} />
                        <span>BibTeX (.bib)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Formatted academic citations ready for LaTeX, Overleaf & Zotero.
                      </p>
                    </div>
                    <div className="rounded-lg bg-card/60 p-2.5 border border-white/[0.04]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                        <Code size={13} />
                        <span>JSON Portfolio</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Complete raw schema for ingestion into personal scripts and databases.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instant Sandbox Switch */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-purple-200">
                        Interactive Testing Sandbox
                      </h4>
                      <p className="text-[11px] text-purple-300/80 mt-0.5">
                        Test this feature right now with 1 click without paying:
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSandboxUpgrade('pro')}
                        disabled={switchingToTier !== null}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {switchingToTier === 'pro' ? 'Switching…' : 'Test as Pro ($10/mo)'}
                      </button>
                      <button
                        onClick={() => handleSandboxUpgrade('advanced')}
                        disabled={switchingToTier !== null}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {switchingToTier === 'advanced' ? 'Switching…' : 'Test as Advanced ($20/mo)'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href="/account/billing"
                    className="text-xs text-primary underline hover:text-primary/80"
                  >
                    View Account & Billing Plans →
                  </Link>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="rounded-lg border border-white/[0.1] bg-secondary/60 px-4 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Pro & Advanced Unlocked Export Modal */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Download size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          Export Saved Intelligence Portfolio
                        </h3>
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase',
                          isAdvanced
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        )}>
                          {displayName} Tier Unlocked
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {items.length} saved intelligence item{items.length === 1 ? '' : 's'} ready for export.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Format selection tabs */}
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
                  <button
                    onClick={() => setExportFormat('markdown')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      exportFormat === 'markdown'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <FileText size={13} />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('bibtex')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      exportFormat === 'bibtex'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <BookOpen size={13} />
                    <span>BibTeX (.bib)</span>
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      exportFormat === 'json'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Code size={13} />
                    <span>Structured JSON</span>
                  </button>
                </div>

                {/* Live Preview Box */}
                <div className="relative">
                  <pre className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/60 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-300/90 selection:bg-emerald-500/30">
                    {formattedExportContent}
                  </pre>
                  <div className="absolute right-3 top-3">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {exportFormat.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyExport}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                      {copiedExport ? (
                        <>
                          <Check size={13} />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadExport}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-secondary/80 px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-all active:scale-95"
                    >
                      <Download size={13} />
                      <span>Download File</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowExportModal(false)}
                    className="rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
