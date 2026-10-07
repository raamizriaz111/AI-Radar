'use client';

import { useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface CollectResult {
  ok: boolean;
  durationMs?: number;
  ran?: number;
  totalCreated?: number;
  totalDiscovered?: number;
  skipped?: string[];
  error?: string;
  results?: Array<{
    sourceName: string;
    status: string;
    itemsCreated: number;
    itemsDiscovered: number;
    itemsDuplicate: number;
    errors: Array<{ message: string }>;
  }>;
}

interface TriggerCollectionButtonProps {
  /** Optional: run a single collector by slug. Omit to run all. */
  slug?: string;
  label?: string;
}

/**
 * Client component that posts to /api/collect to trigger manual collection.
 * Displays live status and result summary inline.
 */
export function TriggerCollectionButton({ slug, label }: TriggerCollectionButtonProps) {
  const [state, setState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<CollectResult | null>(null);

  async function handleCollect() {
    setState('running');
    setResult(null);

    try {
      const response = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: slug ? JSON.stringify({ slug }) : JSON.stringify({}),
      });

      const data = (await response.json()) as CollectResult;

      if (response.ok && data.ok) {
        setState('success');
        setResult(data);
      } else {
        setState('error');
        setResult({ ok: false, error: data.error ?? `HTTP ${response.status}` });
      }
    } catch (err) {
      setState('error');
      setResult({ ok: false, error: err instanceof Error ? err.message : 'Network error' });
    }
  }

  const buttonLabel = label ?? (slug ? `Collect ${slug}` : 'Collect All Sources');

  return (
    <div className="space-y-3">
      <button
        onClick={handleCollect}
        disabled={state === 'running'}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'running' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : state === 'success' ? (
          <RefreshCw size={14} />
        ) : (
          <Play size={14} />
        )}
        {state === 'running' ? 'Collecting…' : buttonLabel}
      </button>

      {/* Result summary */}
      {result && state === 'success' && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={14} />
            <span className="font-medium">Collection complete</span>
            {result.durationMs && (
              <span className="text-muted-foreground">({(result.durationMs / 1000).toFixed(1)}s)</span>
            )}
          </div>
          {result.totalCreated !== undefined && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{result.totalCreated}</span> new items created from{' '}
              <span className="text-foreground font-medium">{result.totalDiscovered}</span> discovered
            </p>
          )}
          {result.results && result.results.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-emerald-500/10">
              {result.results.map((r) => (
                <li key={r.sourceName} className="flex items-center justify-between gap-2">
                  <span className={r.status === 'completed' ? 'text-emerald-400' : r.status === 'partial' ? 'text-amber-400' : 'text-red-400'}>
                    {r.sourceName}
                  </span>
                  <span className="text-muted-foreground">
                    +{r.itemsCreated} new · {r.itemsDuplicate} dup · {r.itemsDiscovered} total
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result.skipped && result.skipped.length > 0 && (
            <p className="text-amber-400 text-[11px]">
              Skipped (not seeded in DB): {result.skipped.join(', ')}
            </p>
          )}
          <p className="text-muted-foreground/60 text-[11px]">Reload page to see updated counts.</p>
        </div>
      )}

      {result && state === 'error' && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertCircle size={14} />
            <span className="font-medium">Collection failed</span>
          </div>
          <p className="text-muted-foreground">{result.error}</p>
          {result.error?.includes('migration') && (
            <p className="mt-2 text-amber-400/80">
              Run <code className="bg-muted px-1 rounded">004_phase3_sources.sql</code> in Supabase SQL Editor first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
