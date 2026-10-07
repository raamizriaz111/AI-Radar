'use client';

// =============================================================================
// AI Radar — Senior Executive Admin Dashboard Component
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Database,
  Layers,
  Activity,
  LogOut,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Compass,
  Cpu,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import type { AdminTelemetryData } from '@/lib/services/adminTelemetryService';
import { PercentageDonutChart } from './PercentageDonutChart';
import { StackedPercentageBar } from './StackedPercentageBar';
import { HorizontalDistributionBars } from './HorizontalDistributionBars';
import { ActivityTimelineChart } from './ActivityTimelineChart';
import { cn } from '@/lib/utils';

interface AdminDashboardViewProps {
  initialTelemetry: AdminTelemetryData;
}

export function AdminDashboardView({ initialTelemetry }: AdminDashboardViewProps) {
  const router = useRouter();
  const [telemetry, setTelemetry] = useState<AdminTelemetryData>(initialTelemetry);
  const [activeTab, setActiveTab] = useState<'categories' | 'sources' | 'trends' | 'velocity'>('categories');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Function to refresh telemetry
  async function refreshTelemetry() {
    try {
      const res = await fetch('/api/admin/telemetry');
      const data = await res.json();
      if (data.ok && data.telemetry) {
        setTelemetry(data.telemetry);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to refresh admin telemetry', err);
    }
  }

  // Handle global source collection
  async function handleSyncSources() {
    setIsSyncing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({
          text: `Collection pipeline finished. ${data.totalCreated ?? data.result?.itemsCreated ?? 0} new items ingested across all desks.`,
          type: 'success',
        });
        await refreshTelemetry();
      } else {
        setActionMessage({ text: data.error || 'Collection failed', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network error triggering ingestion.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  }

  // Handle trend discovery
  async function handleDiscoverTrends() {
    setIsDiscovering(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/trends', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({
          text: `Trend discovery completed. Discovered ${data.discoveredCount ?? 0} cross-source signals.`,
          type: 'success',
        });
        await refreshTelemetry();
      } else {
        setActionMessage({ text: data.error || 'Trend discovery failed', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network error discovering trends.', type: 'error' });
    } finally {
      setIsDiscovering(false);
    }
  }

  // Handle briefing generation
  async function handleGenerateBriefing() {
    setIsBriefing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({
          text: `Daily Executive Briefing synthesized successfully.`,
          type: 'success',
        });
        await refreshTelemetry();
      } else {
        setActionMessage({ text: data.error || 'Briefing synthesis failed', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'Network error generating briefing.', type: 'error' });
    } finally {
      setIsBriefing(false);
    }
  }

  // Handle admin logout
  async function handleLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch {
      window.location.href = '/admin/login';
    }
  }

  const { summary, categoryBreakdown, sourceBreakdown, trendLifecycleBreakdown, trendConfidenceBreakdown, activityTimeline, topTechnologies } = telemetry;

  return (
    <div className="space-y-6">
      {/* Admin Action Feedback Alert */}
      {actionMessage && (
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-medium animate-in fade-in',
            actionMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          )}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Strip & Live Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-white/[0.08] bg-card/70 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
            LIVE TELEMETRY FEED
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-muted-foreground font-mono">
            Updated {lastRefreshedAt.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshTelemetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSyncSources}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Sources'}</span>
          </button>

          <button
            onClick={handleDiscoverTrends}
            disabled={isDiscovering}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
          >
            <TrendingUp size={12} className={isDiscovering ? 'animate-spin' : ''} />
            <span>{isDiscovering ? 'Analyzing...' : 'Run Trends'}</span>
          </button>

          <button
            onClick={handleGenerateBriefing}
            disabled={isBriefing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 disabled:opacity-50 transition-colors"
          >
            <Sparkles size={12} className={isBriefing ? 'animate-spin' : ''} />
            <span>{isBriefing ? 'Synthesizing...' : 'Gen Briefing'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors ml-1"
          >
            <LogOut size={12} />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Scorecards (What's percentage is more out of 100%) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Dominant Category */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-mono">
              Dominant Category
            </span>
            <span className="h-2 w-2 rounded-full bg-violet-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold tracking-tight text-violet-400 font-mono">
              {categoryBreakdown.topDominantPercentage}%
            </span>
            <span className="text-xs text-muted-foreground font-mono">of all intelligence</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {categoryBreakdown.topDominantCategory}
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.05] text-[11px] text-muted-foreground">
            Highest percentage share across {categoryBreakdown.items.length} AI fields
          </div>
        </div>

        {/* KPI 2: Dominant Source */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-mono">
              Top Ingestion Feed
            </span>
            <span className="h-2 w-2 rounded-full bg-sky-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold tracking-tight text-sky-400 font-mono">
              {sourceBreakdown.topDominantPercentage}%
            </span>
            <span className="text-xs text-muted-foreground font-mono">of total items</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {sourceBreakdown.topDominantSource}
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.05] text-[11px] text-muted-foreground">
            Primary feed supplying verified reports & papers
          </div>
        </div>

        {/* KPI 3: Total Verified Records */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-mono">
              Verified Pipeline
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {summary.totalItems}
            </span>
            <span className="text-xs text-emerald-400 font-bold font-mono">Live Ingested</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {summary.activeSources} Connected Global Outlets
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.05] text-[11px] text-muted-foreground">
            {summary.totalTrends} cross-corroborated trend signals
          </div>
        </div>

        {/* KPI 4: System Pipeline Health */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/80 p-5 backdrop-blur-md shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-mono">
              Health & Uptime
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-400 font-mono">
              {summary.ingestionHealthPct}%
            </span>
            <span className="text-xs text-muted-foreground font-mono">Operational</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            0 Parser Exceptions
          </p>
          <div className="mt-3 pt-2.5 border-t border-white/[0.05] text-[11px] text-muted-foreground">
            Deduplication & normalization active
          </div>
        </div>
      </div>

      {/* Global 100% Proportional Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 backdrop-blur-md shadow-xl">
        <StackedPercentageBar
          title="Macro Intelligence Balance: 100% Breakdown by AI Domain"
          items={categoryBreakdown.items}
        />
      </div>

      {/* Section: Multiple Graphs Tab Navigator */}
      <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Real-Time Visual Graphs & Telemetry
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interact with the graphs to inspect the exact percentage ratios and counts out of 100%.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/40 p-1">
            <button
              onClick={() => setActiveTab('categories')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                activeTab === 'categories'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Categories %
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                activeTab === 'sources'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sources %
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                activeTab === 'trends'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Lifecycle & Confidence %
            </button>
            <button
              onClick={() => setActiveTab('velocity')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                activeTab === 'velocity'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Velocity & Keywords
            </button>
          </div>
        </div>

        {/* Tab 1: Category Distribution Graph */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">
                Domain Percentage Donut Chart
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Hover over any slice or legend entry to see exact percentage out of 100%.
              </p>
              <PercentageDonutChart
                items={categoryBreakdown.items}
                totalLabel="Categorized Mentions"
                totalCount={categoryBreakdown.totalCount}
              />
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-white/[0.08] lg:pl-8 pt-6 lg:pt-0">
              <HorizontalDistributionBars
                title="Ranked Dominance Order"
                items={categoryBreakdown.items}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Sources Distribution Graph */}
        {activeTab === 'sources' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">
                Source Ingestion Percentage Share
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Distribution of raw stories and preprints entering the pipeline.
              </p>
              <PercentageDonutChart
                items={sourceBreakdown.items}
                totalLabel="Total Ingested Stories"
                totalCount={sourceBreakdown.totalCount}
              />
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-white/[0.08] lg:pl-8 pt-6 lg:pt-0">
              <HorizontalDistributionBars
                title="Top Ingestion Channels Ranked"
                items={sourceBreakdown.items}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Trends Lifecycle & Confidence */}
        {activeTab === 'trends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground">
                Trend Lifecycle Distribution (100% Normalized)
              </h4>
              <StackedPercentageBar
                items={trendLifecycleBreakdown.items}
              />
              <div className="pt-2">
                <HorizontalDistributionBars
                  items={trendLifecycleBreakdown.items}
                />
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/[0.08] md:pl-8 pt-6 md:pt-0">
              <h4 className="text-sm font-bold text-foreground">
                Corroboration Confidence (100% Normalized)
              </h4>
              <StackedPercentageBar
                items={trendConfidenceBreakdown.items}
              />
              <div className="pt-2">
                <HorizontalDistributionBars
                  items={trendConfidenceBreakdown.items}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Ingestion Velocity & Top Technology Keywords */}
        {activeTab === 'velocity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <ActivityTimelineChart timeline={activityTimeline} />
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-white/[0.08] lg:pl-8 pt-6 lg:pt-0 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Top AI Technology Keyword Density (% out of 100%)
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  NLP Entity Analysis
                </span>
              </div>
              <HorizontalDistributionBars
                items={topTechnologies.map((t, idx) => ({
                  id: `tech-${idx}`,
                  label: t.name,
                  count: t.count,
                  percentage: t.percentage,
                  color: ['#8B5CF6', '#3B82F6', '#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#38BDF8', '#64748B'][idx % 8],
                }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Full Telemetry Breakdown Data Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">
              Complete Percentage Telemetry Ledger
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exact quantitative distribution across categories, volumes, and proportional representation.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 rounded-md">
            Σ = 100.0%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-muted-foreground text-[11px] font-mono uppercase">
                <th className="py-2.5 px-3">Classification Domain</th>
                <th className="py-2.5 px-3">Raw Count</th>
                <th className="py-2.5 px-3">Percentage Share</th>
                <th className="py-2.5 px-3">Visual Ratio (out of 100%)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {categoryBreakdown.items.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.label}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-muted-foreground">
                    {cat.count} items
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-foreground">
                    {cat.percentage}%
                  </td>
                  <td className="py-3 px-3 w-1/3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
