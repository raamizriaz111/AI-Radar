'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  Webhook,
  Code,
  CheckCircle2,
  Lock,
  Sparkles,
  Send,
  AlertCircle,
  Clock,
  Tag,
  Plus,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailAlertSettingsProps {
  currentPlanSlug?: 'free' | 'pro' | 'advanced';
  userEmail?: string;
  onUpgradeClick?: (tier: 'pro' | 'advanced') => void;
}

export function EmailAlertSettings({
  currentPlanSlug = 'free',
  userEmail = 'user@example.com',
  onUpgradeClick,
}: EmailAlertSettingsProps) {
  const [email, setEmail] = useState(userEmail);
  const [digestEnabled, setDigestEnabled] = useState(currentPlanSlug !== 'free');
  const [digestTime, setDigestTime] = useState('07:00 AM');
  const [breakingAlertsEnabled, setBreakingAlertsEnabled] = useState(currentPlanSlug !== 'free');
  const [keywords, setKeywords] = useState<string[]>([
    'reasoning-models',
    'deepseek',
    'coding-agents',
    'mcp-servers',
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Synchronize defaults when plan changes
  useEffect(() => {
    if (currentPlanSlug === 'free') {
      setDigestEnabled(false);
      setBreakingAlertsEnabled(false);
    } else {
      setDigestEnabled(true);
      setBreakingAlertsEnabled(true);
    }
  }, [currentPlanSlug]);

  const maxKeywords = currentPlanSlug === 'free' ? 0 : currentPlanSlug === 'pro' ? 25 : 100;

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed)) return;
    if (keywords.length >= maxKeywords) return;
    setKeywords([...keywords, trimmed]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const isFree = currentPlanSlug === 'free';
  const isAdvanced = currentPlanSlug === 'advanced';

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-card/70 p-5 md:p-6 backdrop-blur-md shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Autonomous Push & Morning Email Alerts
            </h3>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border',
                isFree
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : currentPlanSlug === 'pro'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              )}
            >
              {isFree ? 'Web-Only Mode' : `${currentPlanSlug.toUpperCase()} Alert Active`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Get AI synthesized intelligence delivered to your inbox without having to open the web app.
          </p>
        </div>

        {/* Live Simulation Preview Trigger */}
        <button
          type="button"
          onClick={() => setPreviewModalOpen(true)}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all self-start sm:self-auto"
        >
          <Eye size={14} />
          <span>Preview Morning Digest Email</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
          <span>Alert preferences saved successfully.</span>
        </div>
      )}

      {/* Primary Recipient Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Alert Recipient Email Address</span>
          {isFree && (
            <span className="text-[10px] text-amber-400 font-mono">Requires Pro or Advanced Tier</span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isFree}
            placeholder="your-email@example.com"
            className={cn(
              'flex-1 rounded-lg border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary',
              isFree ? 'opacity-50 border-white/[0.08] cursor-not-allowed' : 'border-white/[0.12]'
            )}
          />
          {isFree ? (
            <button
              type="button"
              onClick={() => onUpgradeClick?.('pro')}
              className="rounded-lg bg-primary min-h-[40px] px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Unlock for $10/mo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-secondary min-h-[40px] px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
            >
              Update
            </button>
          )}
        </div>
      </div>

      {/* Grid of Alert Toggles */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {/* Toggle 1: 7:00 AM Morning Executive Email Digest */}
        <div
          className={cn(
            'rounded-xl border p-4 transition-all flex flex-col justify-between',
            digestEnabled && !isFree
              ? 'border-blue-500/30 bg-blue-500/[0.04]'
              : 'border-white/[0.06] bg-secondary/20'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                <h4 className="text-xs font-bold text-foreground">7:00 AM Executive Digest</h4>
              </div>
              {isFree ? (
                <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  <Lock size={10} /> $10 Pro
                </span>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digestEnabled}
                    onChange={(e) => setDigestEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Synthesizes overnight papers, model drops, and tool releases into a concise, 3-minute executive read delivered straight to your inbox every morning at {digestTime}.
            </p>
          </div>

          {isFree ? (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => onUpgradeClick?.('pro')}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Switch to Pro ($10/mo) to enable daily 7:00 AM emails</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Delivery Time:</span>
              <span className="font-mono text-foreground font-semibold">{digestTime} Local</span>
            </div>
          )}
        </div>

        {/* Toggle 2: Breaking Model & Benchmark Alerts */}
        <div
          className={cn(
            'rounded-xl border p-4 transition-all flex flex-col justify-between',
            breakingAlertsEnabled && !isFree
              ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
              : 'border-white/[0.06] bg-secondary/20'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-emerald-400" />
                <h4 className="text-xs font-bold text-foreground">Breaking Model Alerts</h4>
              </div>
              {isFree ? (
                <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  <Lock size={10} /> $10 Pro
                </span>
              ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={breakingAlertsEnabled}
                    onChange={(e) => setBreakingAlertsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Instant alerts sent within minutes when OpenAI, Anthropic, Google, or Meta release foundation models or major benchmark breakthroughs occur.
            </p>
          </div>

          {isFree ? (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => onUpgradeClick?.('pro')}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Switch to Pro ($10/mo) for instant breakthrough alerts</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Threshold:</span>
              <span className="font-mono text-emerald-400 font-semibold">Tier-1 Labs & SOTA Benchmarks</span>
            </div>
          )}
        </div>
      </div>

      {/* Keyword Triggers Section */}
      <div className="rounded-xl border border-white/[0.06] bg-secondary/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-primary" />
            <h4 className="text-xs font-bold text-foreground">Custom Keyword Triggers</h4>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {keywords.length} / {maxKeywords} configured
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Specify exact keywords or project names to trigger an immediate alert in your digest when mentioned in research or releases.
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium"
            >
              <span>{kw}</span>
              {!isFree && (
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          {keywords.length === 0 && (
            <span className="text-xs text-muted-foreground">No keyword triggers configured.</span>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            disabled={isFree || keywords.length >= maxKeywords}
            placeholder={
              isFree
                ? 'Unlock keyword alerts with Pro ($10/mo)...'
                : 'Add keyword trigger (e.g. llama-3.3, vllm, deepseek)...'
            }
            className={cn(
              'flex-1 rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary',
              isFree ? 'opacity-50 cursor-not-allowed border-white/[0.08]' : 'border-white/[0.12]'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddKeyword();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddKeyword}
            disabled={isFree || !newKeyword.trim() || keywords.length >= maxKeywords}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Advanced Multi-channel Webhook Section */}
      <div
        className={cn(
          'rounded-xl border p-4 space-y-3 transition-all',
          isAdvanced
            ? 'border-purple-500/30 bg-purple-500/[0.04]'
            : 'border-white/[0.06] bg-secondary/10'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook size={15} className="text-purple-400" />
            <h4 className="text-xs font-bold text-foreground">
              Multi-Channel Webhook & Telegram Dispatch
            </h4>
          </div>
          {isAdvanced ? (
            <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-mono font-bold">
              Advanced Unlocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              <Lock size={10} /> $20 Advanced
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Pipe breaking alerts directly to your Discord server, Slack team channel, or personal Telegram bot as JSON payloads within 5 minutes of discovery.
        </p>

        <div className="space-y-2 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
              Webhook URL (Discord, Slack, or HTTP POST)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={!isAdvanced}
              placeholder={
                isAdvanced
                  ? 'https://discord.com/api/webhooks/...'
                  : 'Requires Advanced ($20/mo) plan'
              }
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500',
                !isAdvanced ? 'opacity-50 cursor-not-allowed border-white/[0.08]' : 'border-white/[0.12]'
              )}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
              Telegram Chat ID / Bot Channel
            </label>
            <input
              type="text"
              value={telegramChannel}
              onChange={(e) => setTelegramChannel(e.target.value)}
              disabled={!isAdvanced}
              placeholder={
                isAdvanced ? '@my_ai_radar_alerts or chat ID' : 'Requires Advanced ($20/mo) plan'
              }
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-500',
                !isAdvanced ? 'opacity-50 cursor-not-allowed border-white/[0.08]' : 'border-white/[0.12]'
              )}
            />
          </div>
        </div>

        {!isAdvanced && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onUpgradeClick?.('advanced')}
              className="text-[11px] text-purple-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Switch to Advanced ($20/mo) for programmatic webhooks & Telegram alerts</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      {!isFree && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary min-h-[40px] px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Send size={13} />
            <span>Save & Apply Alert Preferences</span>
          </button>
        </div>
      )}

      {/* MODAL: Morning Executive Digest Email Preview */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.15] bg-[#0c1017] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Live Email Digest Simulation
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    This is the synthesized executive briefing delivered directly to Pro ($10) & Advanced ($20) inboxes every morning at 7:00 AM.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-muted-foreground hover:text-white p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* Email Shell */}
            <div className="rounded-xl border border-white/[0.1] bg-[#111722] p-5 space-y-4 font-sans text-xs">
              {/* Email Metadata */}
              <div className="border-b border-white/[0.06] pb-3 space-y-1 text-muted-foreground text-[11px]">
                <div className="flex justify-between">
                  <span>
                    <strong className="text-foreground">From:</strong> AI Radar Intelligence &lt;briefing@airadar.internal&gt;
                  </span>
                  <span className="font-mono text-primary font-semibold">Today · 7:00 AM</span>
                </div>
                <div>
                  <strong className="text-foreground">To:</strong> {email || 'your-email@domain.com'}
                </div>
                <div>
                  <strong className="text-foreground">Subject:</strong> ⚡ AI Radar Morning Executive Digest: 3 Major Papers, 2 Model Drops & Architectural Blueprints
                </div>
              </div>

              {/* Email Content Body */}
              <div className="space-y-4 text-foreground/90 leading-relaxed">
                <div>
                  <h4 className="text-sm font-extrabold text-foreground text-primary flex items-center gap-1.5 mb-1">
                    <Sparkles size={14} /> Executive Morning Briefing
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Good morning. Here is your 3-minute executive distillation of 48 new preprints, 14 repository releases, and 6 corporate model disclosures from the last 24 hours.
                  </p>
                </div>

                {/* Section 1: Foundation Models & Benchmarks */}
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                    1. Foundation Models & Benchmarks
                  </span>
                  <p className="font-semibold text-foreground">
                    • DeepSeek-V3 Reasoning Distillation: Open weights released with competitive Math500 benchmarks.
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Provides verifiable step-by-step reasoning tokens with 4x latency reduction over standard chain-of-thought methods.
                  </p>
                </div>

                {/* Section 2: Code & Architecture Blueprint */}
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    2. Architecture Blueprint & Implementation
                  </span>
                  <p className="font-semibold text-foreground">
                    • Model Context Protocol (MCP) Standard Adoption:
                  </p>
                  <div className="rounded bg-black/50 p-2 font-mono text-[10px] text-emerald-300 overflow-x-auto border border-emerald-500/20">
                    <code>
                      {`// MCP Server initialization in TypeScript\nimport { Server } from "@modelcontextprotocol/sdk/server/index.js";\nconst server = new Server({ name: "radar-agent", version: "1.0.0" });`}
                    </code>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Standardized schema enables multi-tool coordination across CLI agents without manual adapter code.
                  </p>
                </div>

                {/* Section 3: Verified Primary Citations */}
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 space-y-1 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                    3. Primary Citations & Evidence
                  </span>
                  <p className="text-muted-foreground">
                    1. arXiv:2412.18925 · Reasoning Tokens in Latent Space
                  </p>
                  <p className="text-muted-foreground">
                    2. github.com/modelcontextprotocol/servers · Official reference server implementations
                  </p>
                </div>

                {/* Email Footer */}
                <div className="pt-3 border-t border-white/[0.06] text-[10px] text-muted-foreground/60 flex items-center justify-between">
                  <span>Delivered via AI Radar Push Engine</span>
                  <span>Manage Preferences in Settings</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/[0.08]">
              {isFree ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-amber-400">
                    You are viewing in Free sandbox mode.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      onUpgradeClick?.('pro');
                    }}
                    className="rounded-lg bg-primary min-h-[40px] px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Switch to Pro ($10/mo) to Activate
                  </button>
                </div>
              ) : (
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Scheduled for daily 7:00 AM dispatch to {email}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="rounded-lg bg-secondary min-h-[40px] px-5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 ml-auto transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
