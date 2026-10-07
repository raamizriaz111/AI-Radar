// =============================================================================
// AI Radar — Diagnostics Service
// =============================================================================
// Performs non-invasive database health checks and system diagnostics.
// Never exposes credentials, tokens, or secret values.
// =============================================================================

import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { type CollectionRunRow } from '@/lib/database.types';
import { logger } from '@/lib/services/logger';

export interface DiagnosticsReport {
  timestamp: string;
  database: {
    configured: boolean;
    reachable: boolean;
    serviceKeyConfigured: boolean;
    latencyMs: number | null;
    error: string | null;
  };
  counts: {
    sources: number;
    activeSources: number;
    items: number;
    categories: number;
    bookmarks: number;
    collectionRuns: number;
    summaries: number;
    trends: number;
    dailyBriefings: number;
  };
  latestRun: CollectionRunRow | null;
  system: {
    nodeEnv: string;
    appVersion: string;
  };
}

export async function getDiagnosticsReport(): Promise<DiagnosticsReport> {
  const configured = isDatabaseConfigured();
  const serviceKeyReady = isServiceKeyConfigured();

  const report: DiagnosticsReport = {
    timestamp: new Date().toISOString(),
    database: {
      configured,
      reachable: false,
      serviceKeyConfigured: serviceKeyReady,
      latencyMs: null,
      error: null,
    },
    counts: {
      sources: 0,
      activeSources: 0,
      items: 0,
      categories: 0,
      bookmarks: 0,
      collectionRuns: 0,
      summaries: 0,
      trends: 0,
      dailyBriefings: 0,
    },
    latestRun: null,
    system: {
      nodeEnv: process.env.NODE_ENV ?? 'development',
      appVersion: '1.0.0 (Production)',
    },
  };

  if (!configured) {
    report.database.error = 'Database credentials not configured in environment variables.';
    return report;
  }

  const startTime = Date.now();
  try {
    const supabase = await createClient();

    // 1. Health check: ping categories table
    const { data: pingData, error: pingError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });

    report.database.latencyMs = Date.now() - startTime;

    if (pingError) {
      report.database.reachable = false;
      report.database.error = `Database connection failed: ${pingError.message}`;
      logger.error('Diagnostics ping failed', pingError);
      return report;
    }

    report.database.reachable = true;

    // 2. Query aggregate counts safely
    const safeCount = async (tableName: any) => {
      try {
        const { count, error } = await supabase.from(tableName).select('id', { count: 'exact', head: true });
        if (error) return 0;
        return count ?? 0;
      } catch {
        return 0;
      }
    };

    const [
      sourcesRes,
      activeSourcesRes,
      itemsRes,
      categoriesRes,
      bookmarksRes,
      runsRes,
      latestRunRes,
      summariesRes,
      trendsCount,
      briefingsCount,
    ] = await Promise.all([
      supabase.from('sources').select('id', { count: 'exact', head: true }),
      supabase.from('sources').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('items').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('id', { count: 'exact', head: true }),
      supabase.from('collection_runs').select('id', { count: 'exact', head: true }),
      supabase.from('collection_runs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('summaries').select('id', { count: 'exact', head: true }),
      safeCount('trends'),
      safeCount('daily_briefings'),
    ]);

    report.counts.sources = sourcesRes.count ?? 0;
    report.counts.activeSources = activeSourcesRes.count ?? 0;
    report.counts.items = itemsRes.count ?? 0;
    report.counts.categories = categoriesRes.count ?? 0;
    report.counts.bookmarks = bookmarksRes.count ?? 0;
    report.counts.collectionRuns = runsRes.count ?? 0;
    report.counts.summaries = summariesRes.count ?? 0;
    report.counts.trends = trendsCount;
    report.counts.dailyBriefings = briefingsCount;
    report.latestRun = latestRunRes.data ?? null;

    return report;
  } catch (err) {
    report.database.reachable = false;
    report.database.latencyMs = Date.now() - startTime;
    report.database.error = err instanceof Error ? err.message : 'Unknown database error';
    logger.error('Unexpected error in diagnostics service', err);
    return report;
  }
}
