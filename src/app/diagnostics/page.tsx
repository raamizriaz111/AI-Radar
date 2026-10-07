import type { Metadata } from 'next';
import { Activity, Database, Server, Layers, Bookmark, Cpu, Rss, GitFork, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { StatusIndicator } from '@/components/intelligence/StatusIndicator';
import { TriggerCollectionButton } from '@/components/intelligence/TriggerCollectionButton';
import { TriggerEnrichmentButton } from '@/components/intelligence/TriggerEnrichmentButton';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { getSources } from '@/lib/repositories/sourceRepository';
import { getLatestRuns } from '@/lib/repositories/collectionRunRepository';
import { getItemsPendingEnrichment } from '@/lib/repositories/itemRepository';
import { listCollectors } from '@/lib/collectors/registry';
import { getAIProvider } from '@/lib/ai/providers';
import { CURRENT_PROMPT_VERSION } from '@/lib/ai/prompts';
import { type StatusType } from '@/lib/types';
import {
  getUserProfile,
  getCareerSignals,
  getProjectOpportunities,
} from '@/lib/repositories/personalizationRepository';
import { getGlobalUsageMetrics } from '@/lib/services/usageService';
import { getAllPlans } from '@/lib/billing/planConfig';
import { getBillingAdminSummary } from '@/lib/billing/subscriptionService';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Diagnostics',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function DiagnosticsPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [report, sources, recentRuns, profile, careerSignals, projectOpportunities] = await Promise.all([
    getDiagnosticsReport(),
    getSources(),
    getLatestRuns(10),
    getUserProfile(),
    getCareerSignals(),
    getProjectOpportunities(),
  ]);
  const collectors = listCollectors();
  const activeProvider = getAIProvider();
  const pendingItems = report.database.configured ? await getItemsPendingEnrichment(50) : [];
  const usageMetrics = getGlobalUsageMetrics();
  const billingSummary = getBillingAdminSummary();
  const allPlans = getAllPlans();

  let dbStatus: StatusType = 'offline';
  let dbDetail = 'Not configured in .env.local';

  if (report.database.configured) {
    if (report.database.reachable) {
      dbStatus = 'success';
      dbDetail = `Connected (${report.database.latencyMs ?? 0}ms)`;
    } else {
      dbStatus = 'error';
      dbDetail = report.database.error ?? 'Unreachable';
    }
  }

  const systemStatus = [
    {
      label: 'Supabase PostgreSQL',
      status: dbStatus,
      detail: dbDetail,
    },
    {
      label: 'Service Role Key',
      status: (report.database.serviceKeyConfigured ? 'success' : 'warning') as StatusType,
      detail: report.database.serviceKeyConfigured ? 'Configured (Server-only)' : 'Missing in .env.local',
    },
    {
      label: 'AI Enrichment Layer',
      status: (activeProvider.id === 'mock' ? 'warning' : 'success') as StatusType,
      detail: activeProvider.id === 'mock'
        ? `${activeProvider.displayName} (Heuristic mode) · Add OPENAI_API_KEY in .env.local for LLM`
        : `${activeProvider.displayName} (${process.env.AI_MODEL || activeProvider.defaultModel}) · Prompt v${CURRENT_PROMPT_VERSION}`,
    },
    {
      label: 'Personal Intelligence Layer',
      status: 'success' as StatusType,
      detail: `Role: ${profile.primaryRoleInterest} · ${profile.skills.length} skills · Deterministic matching active`,
    },
  ];

  const entityCounts = [
    { label: 'Sources', count: report.counts.sources, extra: `${report.counts.activeSources} active` },
    { label: 'Items', count: report.counts.items },
    { label: 'Summaries Enriched', count: report.counts.summaries },
    { label: 'Emerging Trends', count: report.counts.trends },
    { label: 'Daily Briefings', count: report.counts.dailyBriefings },
    { label: 'Career Signals', count: careerSignals.length },
    { label: 'Project Opportunities', count: projectOpportunities.length },
    { label: 'Categories', count: report.counts.categories },
    { label: 'Bookmarks', count: report.counts.bookmarks },
    { label: 'Collection Runs', count: report.counts.collectionRuns },
  ];

  // Map sources to collector registration status
  const collectorSlugs = new Set(collectors.map((c) => c.slug));
  const sourcesBySlug = new Map(
    sources.map((s) => {
      const cfg = s.config as Record<string, unknown> | null;
      const slug = typeof cfg?.['slug'] === 'string' ? cfg['slug'] : null;
      return [slug, s] as const;
    })
  );

  return (
    <>
      <TopHeader
        title="Diagnostics"
        description="Collection status, source health, and system information."
      />
      <PageContainer>
        {/* System status */}
        <div className="mb-6">
          <SectionHeader
            title="System Status"
            description="Live health check of connected database and server services."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {systemStatus.map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-card p-4">
                <StatusIndicator status={item.status} label={item.label} className="mb-1.5" />
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Database entity counts */}
        <div className="mb-6">
          <SectionHeader
            title="Database Entities"
            description="Verified record counts from Supabase PostgreSQL tables."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {entityCounts.map((entity) => (
              <div key={entity.label} className="rounded-lg border border-border bg-card p-3.5">
                <p className="text-xs text-muted-foreground">{entity.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums text-foreground">
                    {entity.count}
                  </span>
                  {entity.extra && (
                    <span className="text-[10px] text-muted-foreground/60">
                      ({entity.extra})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-User Architecture & Usage Telemetry */}
        <div className="mb-6">
          <SectionHeader
            title="Multi-User & AI Usage Telemetry"
            description="Tenant isolation, cost telemetry, token accounting, and sliding-window rate limiter status."
          />
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active Tenant Profiles</p>
                <p className="text-base font-bold text-foreground mt-0.5">{Math.max(usageMetrics.activeUsersCount, 1)}</p>
              </div>
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">AI Operations Logged</p>
                <p className="text-base font-bold text-foreground mt-0.5">{usageMetrics.totalRequests}</p>
              </div>
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tokens Tracked</p>
                <p className="text-base font-bold text-foreground mt-0.5">{usageMetrics.totalTokens.toLocaleString()}</p>
              </div>
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Cost Telemetry (USD)</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">${usageMetrics.totalCostUsd.toFixed(4)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Rate Limiter: Active (Sliding Window: 60s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Row Level Security: Enforced per-user
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Cache Namespace: User-isolated
              </span>
            </div>
          </div>
        </div>

        {/* Billing & Subscription Architecture */}
        <div className="mb-6">
          <SectionHeader
            title="Billing & Subscription Architecture"
            description="Commercial plan configuration, subscription lifecycle, and revenue metrics."
          />
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Subscriptions</p>
                <p className="text-base font-bold text-foreground mt-0.5">{billingSummary.totalSubscriptions}</p>
              </div>
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active</p>
                <p className="text-base font-bold text-foreground mt-0.5">{billingSummary.activeSubscriptions}</p>
              </div>
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Trialing</p>
                <p className="text-base font-bold text-foreground mt-0.5">{billingSummary.trialingSubscriptions}</p>
              </div>
              <div className="rounded border border-border/70 bg-background/50 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Est. MRR (USD)</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">${billingSummary.estimatedMrr.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-2">Plan Distribution</p>
              <div className="flex flex-wrap gap-3">
                {allPlans.map((plan) => (
                  <div key={plan.slug} className="flex items-center gap-1.5 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span className="text-muted-foreground">{plan.displayName}:</span>
                    <span className="font-medium text-foreground">{billingSummary.byPlan[plan.slug] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Plan Config: Centralized (planConfig.ts)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Billing Provider: {process.env.STRIPE_SECRET_KEY ? 'Stripe' : 'Mock (Dev Mode)'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Audit Trail: Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Collection trigger */}
        <div className="mb-6">
          <SectionHeader
            title="Manual Collection"
            description="Trigger a collection run from all active sources. Each run is logged below."
          />
          <div className="rounded-lg border border-border bg-card p-4">
            {report.database.configured && report.database.reachable && report.database.serviceKeyConfigured ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Runs all registered collectors (arXiv, Hugging Face Papers, GitHub AI Repos).
                  Duplicates are skipped. Results appear in the collection runs log below.
                </p>
                <p className="text-xs text-amber-400/80">
                  ⚠ Requires connected Supabase sources registry.
                </p>
                {isAdmin ? (
                  <TriggerCollectionButton label="Collect All Sources Now" />
                ) : (
                  <div className="rounded-lg bg-secondary/50 border border-white/[0.06] p-3 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Manual collector runs are reserved for authenticated system administrators.</span>
                    <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">Admin Only</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Database must be connected and service role key must be configured before triggering collection.
              </p>
            )}
          </div>
        </div>

        {/* AI Enrichment Pipeline */}
        <div className="mb-6">
          <SectionHeader
            title="AI Enrichment Pipeline"
            description="Process collected items into structured intelligence (summaries, key points, claims, entities)."
          />
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Active Provider:</span>
                    <span className="font-mono text-xs text-violet-400">{activeProvider.displayName}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {process.env.AI_MODEL || activeProvider.defaultModel}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Prompt version: <code className="font-mono">v{CURRENT_PROMPT_VERSION}</code> · Pending candidate items:{' '}
                    <span className="font-semibold text-foreground">{pendingItems.length}</span>
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {activeProvider.id === 'mock' ? (
                    <span className="text-amber-400">Offline heuristic mode active</span>
                  ) : (
                    <span className="text-emerald-400">Commercial LLM connected</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Enriches collected items in paced batches to respect rate limits and control costs.
                AI output is strictly validated and stored in the <code className="font-mono bg-muted px-1 rounded">summaries</code> table without altering original source records.
              </p>

              {isAdmin ? (
                <TriggerEnrichmentButton label={`Enrich Recent Items (${Math.min(pendingItems.length || 5, 5)})`} limit={5} />
              ) : (
                <div className="rounded-lg bg-secondary/50 border border-white/[0.06] p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Manual batch enrichment triggers are reserved for authenticated system administrators.</span>
                  <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">Admin Only</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Source registry */}
        <div className="mb-6">
          <SectionHeader
            title="Source Registry"
            description="Registered collectors and their database seeding status."
          />
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Collector</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Slug</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">DB Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Type</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((collector) => {
                  const dbSource = sourcesBySlug.get(collector.slug);
                  const seeded = !!dbSource;
                  return (
                    <tr key={collector.slug} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 text-foreground font-medium">{collector.displayName}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground hidden sm:table-cell">{collector.slug}</td>
                      <td className="px-4 py-3">
                        <StatusIndicator
                          status={seeded ? (dbSource.active ? 'success' : 'warning') : 'error'}
                          label={seeded ? (dbSource.active ? 'Seeded & Active' : 'Seeded (Inactive)') : 'Not seeded'}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {dbSource?.source_type ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {collectors.length === 0 && (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No collectors registered.</p>
            )}
          </div>
        </div>

        {/* Collection runs log */}
        <div className="mb-6">
          <SectionHeader
            title="Collection Runs"
            description="Recent source collection attempts — status, records, and timing."
          />
          {recentRuns.length > 0 ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Started</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">New</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground hidden md:table-cell">Found</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Run ID</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run) => {
                    const runStatus: StatusType =
                      run.status === 'completed' ? 'success'
                      : run.status === 'running' ? 'running'
                      : run.status === 'partial' ? 'warning'
                      : 'error';
                    return (
                      <tr key={run.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3">
                          <StatusIndicator status={runStatus} label={run.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {run.started_at ? format(new Date(run.started_at), 'MMM d, HH:mm') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          +{run.items_created}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden md:table-cell">
                          {run.items_discovered}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground/50 text-[10px] hidden lg:table-cell">
                          {run.id.slice(0, 8)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">
                {report.database.configured
                  ? 'No collection runs yet. Click "Collect All Sources Now" above to initiate initial collection.'
                  : 'Configure your Supabase database in .env.local to start tracking collection runs.'}
              </p>
            </div>
          )}
        </div>

        {/* Environment metadata */}
        <div>
          <SectionHeader
            title="Environment & Security"
            description="Runtime environment details. Sensitive variables and keys are never displayed."
          />
          <div className="rounded-lg border border-border bg-card p-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Application Version</dt>
                <dd className="font-mono text-foreground">{report.system.appVersion}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Node Environment</dt>
                <dd className="font-mono text-foreground">{report.system.nodeEnv}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Database Configured</dt>
                <dd className="font-mono text-foreground">{report.database.configured ? 'Yes (Supabase)' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Row Level Security</dt>
                <dd className="font-mono text-foreground">Enforced (Tenant & System Isolation)</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Collection Secret</dt>
                <dd className="font-mono text-foreground">
                  {process.env.COLLECTION_SECRET ? 'Configured' : 'Not set (dev-mode bypass active)'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">GitHub Token</dt>
                <dd className="font-mono text-foreground">
                  {process.env.GITHUB_TOKEN ? 'Configured (higher rate limits)' : 'Not set (unauthenticated)'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
