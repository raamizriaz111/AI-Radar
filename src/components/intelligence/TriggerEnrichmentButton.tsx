'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface BatchEnrichResult {
  ok: boolean;
  durationMs?: number;
  processed?: number;
  succeeded?: number;
  failed?: number;
  skipped?: number;
  error?: string;
  items?: Array<{
    id: string;
    title: string;
    status: string;
    error?: string;
  }>;
}

interface TriggerEnrichmentButtonProps {
  itemId?: string;
  label?: string;
  limit?: number;
}

/**
 * Client component that triggers AI enrichment via /api/enrich and
 * displays live results and progress inline.
 */
export function TriggerEnrichmentButton({
  itemId,
  label,
  limit = 5,
}: TriggerEnrichmentButtonProps) {
  const [state, setState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<BatchEnrichResult | null>(null);

  async function handleEnrich() {
    setState('running');
    setResult(null);

    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId ? { itemId } : { limit }),
      });

      const data = (await response.json()) as BatchEnrichResult;

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

  const buttonLabel = label ?? (itemId ? 'Enrich with AI' : `Enrich Recent Items (${limit})`);

  return (
    <div className="space-y-3">
      <button
        onClick={handleEnrich}
        disabled={state === 'running'}
        className="inline-flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'running' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : state === 'success' ? (
          <RefreshCw size={14} />
        ) : (
          <Sparkles size={14} />
        )}
        {state === 'running' ? 'Enriching with AI…' : buttonLabel}
      </button>

      {/* Result summary */}
      {result && state === 'success' && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-violet-400">
            <CheckCircle2 size={14} />
            <span className="font-medium">Enrichment complete</span>
            {result.durationMs && (
              <span className="text-muted-foreground">({(result.durationMs / 1000).toFixed(1)}s)</span>
            )}
          </div>
          {result.succeeded !== undefined && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{result.succeeded}</span> items enriched with structured summaries and claims (
              <span className="text-foreground">{result.processed}</span> processed).
            </p>
          )}
          {result.items && result.items.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-violet-500/10">
              {result.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2">
                  <span className={it.status === 'completed' ? 'text-violet-300' : 'text-red-400'}>
                    {it.title.length > 50 ? `${it.title.slice(0, 50)}…` : it.title}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {it.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground/60 text-[11px]">
            Refresh the dashboard or news/research pages to view enriched cards.
          </p>
        </div>
      )}

      {result && state === 'error' && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertCircle size={14} />
            <span className="font-medium">Enrichment failed</span>
          </div>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      )}
    </div>
  );
}
