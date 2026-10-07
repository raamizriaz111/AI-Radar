'use client';

// =============================================================================
// AI Radar — In-Card Architecture Blueprint & Developer Spec Drawer
// Displays unlocked production code specs for Pro/Advanced, or sleek teaser for Free
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code,
  Lock,
  Copy,
  Check,
  Sparkles,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileJson,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { IntelligenceItemWithSummary } from '@/lib/types';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { getArchitectureBlueprint } from '@/lib/intelligence/blueprintService';
import { cn } from '@/lib/utils';

interface CardBlueprintDrawerProps {
  item: IntelligenceItemWithSummary;
  isOpen: boolean;
  onClose: () => void;
}

export function CardBlueprintDrawer({ item, isOpen, onClose }: CardBlueprintDrawerProps) {
  const { isFree, isPro, isAdvanced, switchPlan } = useCurrentPlan();
  const [activeTab, setActiveTab] = useState<'code' | 'json'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!isOpen) return null;

  const blueprint = getArchitectureBlueprint(item);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(blueprint.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(blueprint.rawJsonPayload, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {}
  };

  const handleQuickUnlock = async () => {
    setSwitching(true);
    await switchPlan('advanced');
    setSwitching(false);
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.1] bg-black/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Drawer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal size={14} className={isFree ? 'text-muted-foreground' : 'text-primary'} />
          <span className="text-xs font-bold text-foreground truncate">
            {blueprint.title}
          </span>
          <span className="rounded bg-secondary/80 px-2 py-0.5 text-[9px] font-mono text-muted-foreground uppercase hidden sm:inline-block">
            {blueprint.deploymentTag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isFree && (
            <div className="flex items-center rounded-lg bg-white/[0.05] p-0.5 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={cn(
                  'rounded px-2 py-1 text-[10px] font-mono font-bold transition-colors',
                  activeTab === 'code'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Code Spec
              </button>
              {isAdvanced && (
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={cn(
                    'rounded px-2 py-1 text-[10px] font-mono font-bold transition-colors flex items-center gap-1',
                    activeTab === 'json'
                      ? 'bg-purple-600 text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <FileJson size={10} />
                  <span>Raw JSON</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Collapse blueprint drawer"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isFree ? (
        /* Free Tier Gated Teaser */
        <div className="relative p-4 sm:p-5">
          {/* Blurred Code Background */}
          <div className="select-none blur-[4px] opacity-40 font-mono text-[11px] text-emerald-400 space-y-1 overflow-hidden max-h-28">
            <p>{'// Production Implementation Spec for ' + item.title}</p>
            <p>import &#123; Server, Agent &#125; from &quot;@modelcontextprotocol/sdk&quot;;</p>
            <p>const client = new AgentEngine(&#123; streaming: true, kvCache: &quot;fp8&quot; &#125;);</p>
            <p>await client.verifyBenchmark(&#123; primaryCitations: true &#125;);</p>
          </div>

          {/* Locked Overlay Card */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/75 backdrop-blur-[2px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
              <Lock size={15} />
            </div>
            <h5 className="text-xs font-bold text-foreground mb-1">
              Architecture Blueprint &amp; Implementation Spec Locked
            </h5>
            <p className="text-[11px] text-muted-foreground max-w-md mb-3 leading-relaxed">
              Unlocked for <strong className="text-foreground">Pro ($10)</strong> &amp; <strong className="text-foreground">Advanced ($20)</strong> subscribers. Includes full copyable TypeScript/Python code specs, MCP server configurations, and raw JSON API streams.
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Link
                href="/account/billing?select=pro"
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Sparkles size={12} />
                <span>Unlock on Pro ($10/mo)</span>
              </Link>
              <button
                type="button"
                onClick={handleQuickUnlock}
                disabled={switching}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                {switching ? 'Unlocking…' : '1-Click Sandbox Test (Advanced)'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Unlocked Developer View (Pro & Advanced) */
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Architectural Notes */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-[11px] space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Senior Architectural Takeaways:
            </span>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pt-0.5">
              {blueprint.architectureNotes.map((note, idx) => (
                <li key={idx}>
                  <span className="text-foreground/90">{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code or JSON View */}
          <div className="relative rounded-lg bg-black border border-white/[0.08] p-3 overflow-x-auto">
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
              {activeTab === 'code' ? (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 rounded bg-secondary/80 px-2.5 py-1 text-[10px] font-mono font-medium text-foreground hover:bg-secondary transition-colors border border-white/[0.08]"
                >
                  {copiedCode ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy {blueprint.language.toUpperCase()}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 rounded bg-secondary/80 px-2.5 py-1 text-[10px] font-mono font-medium text-foreground hover:bg-secondary transition-colors border border-white/[0.08]"
                >
                  {copiedJson ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">JSON Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy JSON Payload</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <pre className="font-mono text-[11px] leading-relaxed text-emerald-300 pr-28">
              <code>
                {activeTab === 'code'
                  ? blueprint.code
                  : JSON.stringify(blueprint.rawJsonPayload, null, 2)}
              </code>
            </pre>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono pt-1">
            <span>
              {isAdvanced
                ? '⚡ Advanced Plan: Full Code Blueprint + JSON API Payload Unlocked'
                : '✓ Pro Plan: Code Blueprint Unlocked'}
            </span>
            <Link href="/account/billing" className="hover:text-primary transition-colors">
              Manage Tier Settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
