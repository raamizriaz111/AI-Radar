// =============================================================================
// AI Radar — Trend Detail Page (Phase 5)
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Layers,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  GitCommit,
  Cpu,
  Building,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { getTrendBySlug } from '@/lib/repositories/trendRepository';
import { TrendStatusBadge, TrendConfidenceBadge } from '@/components/intelligence/TrendBadge';
import { SourceBadge } from '@/components/intelligence/SourceBadge';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface TrendDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TrendDetailPage({ params }: TrendDetailPageProps) {
  const resolvedParams = await params;
  const trend = await getTrendBySlug(resolvedParams.slug);

  if (!trend) {
    notFound();
  }

  const technologies = Array.isArray(trend.technologies)
    ? (trend.technologies as string[])
    : [];

  const entities = Array.isArray(trend.entities)
    ? (trend.entities as Array<{ name?: string; type?: string }>)
    : [];

  const timeline = Array.isArray(trend.timeline)
    ? (trend.timeline as Array<{
        date: string;
        title: string;
        sourceName: string;
        itemId?: string;
        takeaway: string;
      }>)
    : [];

  const evidence = trend.evidenceList || [];

  // Group evidence by relationship type
  const supporting = evidence.filter((e) => e.relationship_type === 'supporting');
  const contradictory = evidence.filter((e) => e.relationship_type === 'contradictory');
  const related = evidence.filter(
    (e) => e.relationship_type !== 'supporting' && e.relationship_type !== 'contradictory'
  );

  return (
    <>
      <TopHeader
        title={trend.title}
        description={`Trend Analysis · ${trend.distinct_source_count} Independent Sources`}
      />
      <PageContainer>
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/trends"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Emerging Trends
          </Link>
        </div>

        {/* Trend Header Banner */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TrendStatusBadge status={trend.status} />
              <TrendConfidenceBadge
                confidence={trend.confidence}
                score={trend.confidence_score}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers size={14} />
                <strong>{trend.distinct_source_count}</strong> distinct sources
              </span>
              <span className="flex items-center gap-1">
                <GitCommit size={14} />
                <strong>{trend.item_count}</strong> evidence items
              </span>
              {(trend.activity_change_pct ?? 0) !== 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp size={14} />
                  +{trend.activity_change_pct}% velocity
                </span>
              )}
            </div>
          </div>

          <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
            {trend.title}
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {trend.summary || trend.description}
          </p>

          {/* Tags */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            {technologies.length > 0 && (
              <div className="flex items-center gap-1.5 mr-3">
                <Cpu size={13} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Tech:</span>
                {technologies.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {entities.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Building size={13} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Entities:</span>
                {entities.map((e, idx) => (
                  <span
                    key={idx}
                    className="rounded border border-border/80 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Insights: Why It Matters & What To Watch */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Why It Matters
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {trend.why_it_matters ||
                'Signals indicate growing interest from multiple repositories and preprints, affecting deployment costs and model performance.'}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              What To Watch
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {trend.what_to_watch ||
                'Watch for independent reproduction benchmarks, integration into standard inference libraries, and real-world failure analyses.'}
            </p>
          </div>
        </div>

        {/* Contradictory / Disputed Evidence Banner (if present) */}
        {contradictory.length > 0 && (
          <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="mb-2 flex items-center gap-2 text-amber-400">
              <ShieldAlert size={16} />
              <h2 className="text-sm font-semibold">
                Contradictory or Disputed Evidence ({contradictory.length})
              </h2>
            </div>
            <p className="mb-4 text-xs text-amber-300/80">
              AI Radar explicitly preserves conflicting evidence, benchmark disputes, and identified limitations to prevent overhyped assertions.
            </p>
            <div className="space-y-2">
              {contradictory.map((c) => (
                <div
                  key={c.id}
                  className="rounded-md border border-amber-500/20 bg-background/50 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={c.item.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:underline"
                    >
                      {c.item.title}
                    </a>
                    <SourceBadge name={c.item.source?.name || 'Source'} />
                  </div>
                  {c.notes && (
                    <p className="mt-1 text-[11px] text-amber-400/90">{c.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Timeline */}
        {timeline.length > 0 && (
          <div className="mb-8">
            <SectionHeader
              title="Development Timeline"
              description="Chronological milestones and publications supporting this trend."
            />
            <div className="relative border-l border-border pl-6 space-y-6">
              {timeline.map((entry, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                    <Calendar size={12} />
                    <span>{entry.date}</span>
                    <span>·</span>
                    <span className="font-medium text-foreground/80">{entry.sourceName}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {entry.takeaway}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Evidence Explorer */}
        <div className="mb-8">
          <SectionHeader
            title="Supporting Evidence Items"
            description={`Verified publications, repositories, and releases (${supporting.length + related.length} items)`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[...supporting, ...related].map((ev) => (
              <article
                key={ev.id}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                      ev.relationship_type === 'supporting'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {ev.relationship_type}
                  </span>
                  <SourceBadge
                    name={ev.item.source?.name || 'Source'}
                    url={ev.item.source?.base_url}
                  />
                </div>

                <h3 className="mb-1.5 text-xs font-semibold text-foreground line-clamp-2">
                  <a
                    href={ev.item.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {ev.item.title}
                    <ExternalLink size={10} className="inline flex-shrink-0" />
                  </a>
                </h3>

                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 mb-2">
                  {typeof ev.item.summary?.significance === 'string'
                    ? ev.item.summary.significance
                    : Array.isArray(ev.item.summary?.key_points) && typeof ev.item.summary.key_points[0] === 'string'
                    ? ev.item.summary.key_points[0]
                    : ev.item.description || ev.notes || 'Supporting development'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 border-t border-border/40 pt-2">
                  <span>Strength: {ev.evidence_strength}</span>
                  <span>{ev.item.published_at?.slice(0, 10)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
