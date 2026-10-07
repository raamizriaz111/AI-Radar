'use client';

// =============================================================================
// AI Radar — Interactive Trends View (Phase 5)
// =============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Filter,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
  Layers,
} from 'lucide-react';
import type { TrendRow, TrendStatus } from '@/lib/database.types';
import { TrendCard } from './TrendCard';
import { EmptyState } from './EmptyState';

interface TrendsViewProps {
  initialTrends: TrendRow[];
}

export function TrendsView({ initialTrends }: TrendsViewProps) {
  const router = useRouter();
  const [trends, setTrends] = useState<TrendRow[]>(initialTrends);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);

  // Trigger Trend Discovery
  const handleDiscoverTrends = async () => {
    setIsDiscovering(true);
    setMessage(null);

    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.ok) {
        setMessage({
          text: `Analyzed ${data.itemsAnalyzed ?? 0} items and identified ${data.discoveredCount ?? 0} trends.`,
          type: 'info',
        });
        // Reload trends list
        const fetchRes = await fetch('/api/trends');
        const refreshed = await fetchRes.json();
        if (refreshed.ok && Array.isArray(refreshed.trends)) {
          setTrends(refreshed.trends);
        }
        router.refresh();
      } else {
        setMessage({
          text: data.error || 'Failed to discover trends.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Error triggering trend discovery.',
        type: 'error',
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Filter trends
  const filteredTrends = trends.filter((trend) => {
    // Status filter
    if (selectedStatus !== 'all' && trend.status !== selectedStatus) {
      return false;
    }

    // Confidence filter
    if (selectedConfidence !== 'all' && trend.confidence !== selectedConfidence) {
      return false;
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = trend.title.toLowerCase().includes(q);
      const descMatch = (trend.summary || trend.description || '').toLowerCase().includes(q);
      const techMatch = Array.isArray(trend.technologies)
        ? (trend.technologies as string[]).some((t) => t.toLowerCase().includes(q))
        : false;

      if (!titleMatch && !descMatch && !techMatch) return false;
    }

    return true;
  });

  const statuses: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Lifecycle' },
    { id: 'established', label: 'Established' },
    { id: 'developing', label: 'Developing' },
    { id: 'early_signal', label: 'Early Signals' },
    { id: 'uncertain', label: 'Uncertain' },
    { id: 'declining', label: 'Declining' },
  ];

  const confidences: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Confidence' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  return (
    <div>
      {/* Controls Banner */}
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by keyword, tech, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscoverTrends}
            disabled={isDiscovering}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isDiscovering ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Analyzing Signals...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Run Trend Discovery
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
            message.type === 'info'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          <AlertCircle size={14} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Chips */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedStatus === st.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          {confidences.map((conf) => (
            <button
              key={conf.id}
              onClick={() => setSelectedConfidence(conf.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                selectedConfidence === conf.id
                  ? 'bg-secondary text-foreground border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {conf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {filteredTrends.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filteredTrends.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={TrendingUp}
            title={trends.length === 0 ? 'No trend signals yet.' : 'No trends match current filters.'}
            description={
              trends.length === 0
                ? 'AI Radar analyzes items from independent sources to discover recurring patterns and signals. Click "Run Trend Discovery" to analyze collected items.'
                : 'Try adjusting your lifecycle or confidence filters.'
            }
            action={
              trends.length === 0 ? (
                <button
                  onClick={handleDiscoverTrends}
                  disabled={isDiscovering}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Sparkles size={13} /> Run Trend Discovery Now
                </button>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
