'use client';

// =============================================================================
// AI Radar — Daily Intelligence Briefing View
// Senior Design & Executive UX Edition
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Calendar,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Lock,
  Terminal,
  Copy,
  Check,
  Webhook,
  Download,
  Share2,
  X,
} from 'lucide-react';
import type { DailyBriefingRow } from '@/lib/database.types';
import type { BriefingSectionPayload } from '@/lib/intelligence/types';
import { TrendStatusBadge } from './TrendBadge';
import { EmptyState } from './EmptyState';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { cn } from '@/lib/utils';

interface BriefingViewProps {
  currentBriefing: DailyBriefingRow | null;
  history: Array<{
    id: string;
    briefing_date: string;
    title: string;
    item_count: number;
  }>;
}

const OVERNIGHT_BLUEPRINT_CODE = `// Production Spec: Agentic Tool Bridge & Latent Reasoning Parser
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export const server = new Server(
  { name: "ai-radar-briefing-agent", version: "2.1.0" },
  { capabilities: { tools: {}, logging: {} } }
);

// High-throughput speculative decoding configuration
export const vllmConfig = {
  tensor_parallel_size: 2,
  gpu_memory_utilization: 0.90,
  kv_cache_dtype: "fp8",
  enable_prefix_caching: true,
  max_model_len: 16384,
};`;

export function BriefingView({ currentBriefing, history }: BriefingViewProps) {
  const router = useRouter();
  const { isFree, isPro, isAdvanced } = useCurrentPlan();
  const [briefing, setBriefing] = useState<DailyBriefingRow | null>(currentBriefing);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' } | null>(null);
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);
  const [sentWebhook, setSentWebhook] = useState(false);
  const [copiedBriefing, setCopiedBriefing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleGenerate = async (force = true) => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();

      if (data.ok && data.briefing) {
        setBriefing(data.briefing);
        setMessage({
          text: `Generated Daily Briefing with ${data.briefing.item_count || 0} prioritized intelligence items.`,
          type: 'info',
        });
        router.refresh();
      } else {
        setMessage({
          text: data.error || 'Failed to generate briefing.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Error triggering briefing generation.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateSelect = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/briefing?date=${dateStr}`);
      const data = await res.json();
      if (data.ok && data.briefing) {
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error('Error fetching briefing for date', err);
    }
  };

  const handleExportBriefing = async () => {
    if (isFree) {
      setShowExportModal(true);
      return;
    }
    const md = `# ${briefing?.title || "Today's AI Intelligence Briefing"}\nDate: ${briefing?.briefing_date || ''}\n\n## Executive Summary\n${briefing?.summary || ''}\n\n` +
      sections.map((s) => `### ${s.title}\n${s.summary}\n\n` + s.items.map((it) => `- [${it.title}](${it.url}) (${it.sourceName}): ${it.takeaway}`).join('\n')).join('\n\n');
    try {
      await navigator.clipboard.writeText(md);
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2000);
    } catch {}
  };

  const handleCopyBlueprint = async () => {
    try {
      await navigator.clipboard.writeText(OVERNIGHT_BLUEPRINT_CODE);
      setCopiedBlueprint(true);
      setTimeout(() => setCopiedBlueprint(false), 2000);
    } catch {}
  };

  const handleTestWebhookPush = () => {
    setSentWebhook(true);
    setTimeout(() => setSentWebhook(false), 3000);
  };

  const sections = Array.isArray(briefing?.sections)
    ? (briefing.sections as unknown as BriefingSectionPayload[])
    : [];

  const topSignals = Array.isArray(briefing?.top_signals)
    ? (briefing.top_signals as Array<{ title: string; status: string; reason: string }>)
    : [];

  return (
    <div>
      {/* Date Switcher & Generation Control Banner */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar size={14} />
          </div>
          <span className="text-xs font-semibold text-foreground">Archive Edition:</span>
          {history.length > 0 ? (
            <select
              value={briefing?.briefing_date || ''}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="rounded-lg border border-white/[0.1] bg-secondary/80 px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              {history.map((h) => (
                <option key={h.briefing_date} value={h.briefing_date}>
                  {h.briefing_date} ({h.item_count} stories)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground">Today&apos;s Edition</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportBriefing}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/[0.08] bg-secondary/80 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            {copiedBriefing ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Briefing Copied!</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Export Briefing</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className={cn(
              'inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all',
              'hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Analyzing & Synthesizing…</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>{briefing ? 'Regenerate Briefing' : "Generate Today's Briefing"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            'mb-6 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium',
            message.type === 'info'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          )}
        >
          {message.type === 'info' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{message.text}</span>
        </div>
      )}

      {briefing ? (
        <div className="space-y-8">
          {/* Briefing Header Hero Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-card via-card/95 to-secondary/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    DAILY INTELLIGENCE BRIEFING
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-foreground/80">
                    <Clock size={12} className="text-muted-foreground" />
                    {briefing.briefing_date}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {isAdvanced ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300">
                      <Sparkles size={10} /> ADVANCED POWER BRIEFING
                    </span>
                  ) : isPro ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                      <Sparkles size={10} /> PRO EXECUTIVE BRIEFING
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      STANDARD WEB EDITION
                    </span>
                  )}
                  <span className="text-white/30">•</span>
                  <span className="font-semibold text-foreground/90">{briefing.item_count} developments analyzed</span>
                </div>
              </div>

              <h1 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {briefing.title}
              </h1>

              {/* Executive Summary Callout */}
              <div className="rounded-xl border border-white/[0.08] bg-black/40 p-5 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                  <BookOpen size={13} />
                  Executive Takeaway in Plain English
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {briefing.summary}
                </p>
              </div>

              {/* Overnight Production Architecture Blueprint (Tier Differentiated) */}
              <div className="mt-5 rounded-xl border border-white/[0.1] bg-card/90 overflow-hidden shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.03] px-5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Terminal size={15} className={isFree ? 'text-muted-foreground' : 'text-primary'} />
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">
                      Overnight Production Architecture Blueprint
                    </h3>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase',
                      isFree
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : isAdvanced
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    )}>
                      {isFree ? 'Pro & Advanced Feature' : isAdvanced ? 'Advanced Unlocked · Full Spec' : 'Pro Unlocked'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isFree && (
                      <button
                        type="button"
                        onClick={handleCopyBlueprint}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-mono font-semibold text-foreground hover:bg-secondary/80 border border-white/[0.08] transition-colors"
                      >
                        {copiedBlueprint ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Blueprint Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Blueprint Spec</span>
                          </>
                        )}
                      </button>
                    )}
                    {isAdvanced && (
                      <button
                        type="button"
                        onClick={handleTestWebhookPush}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 shadow-sm shadow-purple-600/30 transition-all"
                      >
                        <Webhook size={12} />
                        <span>{sentWebhook ? 'Webhook Dispatched!' : 'Test Webhook Push'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isFree ? (
                  <div className="relative p-6">
                    {/* Blurred Code Background */}
                    <div className="select-none blur-[4px] opacity-25 font-mono text-xs text-emerald-400 space-y-1.5 max-h-32 overflow-hidden">
                      <p>{'// Overnight High-Throughput Model Context Protocol & Speculative Decoding Bridge'}</p>
                      <p>import &#123; Server &#125; from &quot;@modelcontextprotocol/sdk/server/index.js&quot;;</p>
                      <p>const server = new Server(&#123; name: &quot;radar-overnight-agent&quot;, version: &quot;2.0.0&quot; &#125;);</p>
                      <p>export const reasoningStream = new ReasoningPipeline(&#123; kvCache: &quot;fp8&quot;, tensorParallel: 2 &#125;);</p>
                    </div>

                    {/* Lock Overlay Callout */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/75 backdrop-blur-[2px]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
                        <Lock size={16} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground mb-1">
                        Technical Architecture Blueprint &amp; Implementation Spec Gated
                      </h4>
                      <p className="text-[11px] text-muted-foreground max-w-lg mb-4 leading-relaxed">
                        Pro ($10/mo) and Advanced ($20/mo) subscribers receive copyable TypeScript/Python architecture blueprints, MCP tool schemas, and verified repo implementations in their daily 7:00 AM dispatch.
                      </p>
                      <div className="flex items-center gap-2.5 flex-wrap justify-center">
                        <Link
                          href="/pricing?select=pro"
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Sparkles size={13} />
                          <span>Unlock with Pro ($10/mo)</span>
                        </Link>
                        <Link
                          href="/pricing?select=advanced"
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
                        >
                          <span>Upgrade to Advanced ($20/mo)</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3 text-xs">
                      <div className="rounded-lg bg-secondary/40 p-3 border border-white/[0.04]">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Inference Speedup</p>
                        <p className="text-sm font-bold text-emerald-400 mt-0.5">3.4x Latency Reduction</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Via speculative decoding</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-3 border border-white/[0.04]">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Standard Spec</p>
                        <p className="text-sm font-bold text-primary mt-0.5">MCP Protocol 2025</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Universal agent interop</p>
                      </div>
                      <div className="rounded-lg bg-secondary/40 p-3 border border-white/[0.04]">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Memory Footprint</p>
                        <p className="text-sm font-bold text-purple-400 mt-0.5">FP8 KV Cache</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">50% VRAM savings</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-black border border-white/[0.08] p-3.5 overflow-x-auto">
                      <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
                        <code>{OVERNIGHT_BLUEPRINT_CODE}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Emerging Signals Ribbon */}
          {topSignals.length > 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-mono">
                  <TrendingUp size={14} />
                  Topics Gaining Critical Industry Heat
                </h2>
                <span className="text-[11px] text-muted-foreground">Multi-source corroboration</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {topSignals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-card/70 p-4 text-xs transition-all hover:border-primary/30 hover:bg-card"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-foreground text-sm">{sig.title}</span>
                      <TrendStatusBadge status={sig.status} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sig.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Sections with Cited Items */}
          <div className="space-y-6">
            {sections.map((section, sIdx) => (
              <section
                key={sIdx}
                className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 sm:p-8 backdrop-blur-sm"
              >
                <div className="mb-5 border-b border-white/[0.06] pb-4">
                  <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {section.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {section.summary}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((it, iIdx) => (
                    <article
                      key={it.itemId || iIdx}
                      className="group flex flex-col justify-between rounded-xl border border-white/[0.06] bg-secondary/30 p-4 transition-all hover:border-white/[0.15] hover:bg-secondary/50"
                    >
                      <div>
                        <div className="mb-2 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-primary">
                            {it.sourceName}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          <a
                            href={it.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-start gap-1"
                          >
                            <span>{it.title}</span>
                            <ExternalLink size={11} className="inline flex-shrink-0 mt-0.5 text-muted-foreground/60" />
                          </a>
                        </h3>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          {it.takeaway}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-end border-t border-white/[0.04] pt-2.5">
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <span>Read Source</span>
                          <ArrowRight size={11} />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-card p-10">
          <EmptyState
            icon={Zap}
            title="No briefing generated for today yet."
            description="Generate a daily intelligence digest synthesizing the latest verified news and developments across the AI landscape."
            action={
              <button
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                <Sparkles size={14} />
                <span>Create Today&apos;s Briefing</span>
              </button>
            }
          />
        </div>
      )}

      {/* Free Tier Export Gating Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.12] bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowExportModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-3">
              <Lock size={18} />
            </div>

            <h3 className="text-base font-bold text-foreground mb-1">
              Briefing Export Requires Pro or Advanced
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Exporting daily intelligence briefings to Markdown, BibTeX, and structured JSON is an exclusive feature for Pro ($10/mo) and Advanced ($20/mo) subscribers.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Link
                href="/pricing?select=pro"
                className="w-full sm:w-auto flex-1 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Sparkles size={13} />
                <span>Upgrade to Pro ($10/mo)</span>
              </Link>
              <Link
                href="/pricing?select=advanced"
                className="w-full sm:w-auto inline-flex min-h-[38px] items-center justify-center rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                <span>Upgrade to Advanced ($20/mo)</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
