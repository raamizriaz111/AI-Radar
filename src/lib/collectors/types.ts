// =============================================================================
// AI Radar — Collector Types (Phase 3)
// =============================================================================
// Defines the shared contract every source collector must implement.
// The pipeline is:
//   fetch → parse → normalize → validate → deduplicate → classify → store → report
// =============================================================================

import type { CreateItemInput } from '@/lib/validation/schemas';

// ---------------------------------------------------------------------------
// Item type used inside the collector pipeline (before DB insert)
// ---------------------------------------------------------------------------

export interface NormalizedItem {
  /** Globally unique URL to the original item. Canonical, lowercase-normalised. */
  canonicalUrl: string;
  /** Source-specific identifier (e.g. arXiv ID, GitHub repo full_name). */
  externalId?: string | null;
  /** Human-readable title. */
  title: string;
  /** Short description / abstract excerpt (≤ 1000 chars recommended). */
  description?: string | null;
  /** Author names. */
  authors?: string[];
  /** ISO 8601 datetime of original publication. */
  publishedAt?: string | null;
  /** Item type from the ItemTypeEnum. */
  itemType: CreateItemInput['item_type'];
  /** Category slugs to assign. */
  categorySlugs: string[];
  /** Source-specific metadata preserved verbatim. Treat as untrusted data. */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Result returned by each collector run
// ---------------------------------------------------------------------------

export interface CollectorRunResult {
  /** Slug/name used to identify the source (matches DB source slug). */
  sourceName: string;
  /** ISO 8601 start time. */
  startedAt: string;
  /** ISO 8601 finish time. */
  finishedAt: string;
  /** Final status of this run. */
  status: 'completed' | 'partial' | 'failed';
  /** Total records fetched from remote source. */
  itemsDiscovered: number;
  /** New items inserted into the database. */
  itemsCreated: number;
  /** Items that were already present (deduplicated). */
  itemsDuplicate: number;
  /** Items that were skipped or invalid (validation failures). */
  itemsSkipped: number;
  /** Error details if the run failed partially or completely. */
  errors: Array<{ message: string; context?: Record<string, unknown> }>;
}

// ---------------------------------------------------------------------------
// Configuration passed to each collector
// ---------------------------------------------------------------------------

export interface CollectorConfig {
  /** DB row ID of the source. Must be pre-seeded. */
  sourceId: string;
  /** Display name for logging. */
  sourceName: string;
  /** Maximum items to fetch per run (soft cap to protect rate limits). */
  maxItems?: number;
  /** Request timeout in milliseconds. Default: 15_000 */
  timeoutMs?: number;
  /** Number of retry attempts on transient errors. Default: 2 */
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Abstract collector interface
// ---------------------------------------------------------------------------

export interface Collector {
  /** Unique slug for this collector (matches source slug in DB). */
  readonly slug: string;
  /** Friendly display name. */
  readonly displayName: string;
  /** Run the full collection pipeline and return a result report. */
  collect(config: CollectorConfig): Promise<CollectorRunResult>;
}
