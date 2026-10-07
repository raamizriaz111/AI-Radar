// =============================================================================
// AI Radar — Collector Registry (Phase 3)
// =============================================================================
// Central registry mapping source slugs to collector instances.
// Add new collectors here as they are implemented.
// =============================================================================

import { arxivCollector } from './arxiv';
import { huggingFacePapersCollector } from './huggingface';
import { githubCollector } from './github';
import { worldNewsCollector } from './news';
import type { Collector } from './types';

/**
 * All registered collectors, keyed by their source slug.
 * The slug must match the `slug` field in the DB sources table.
 */
export const COLLECTOR_REGISTRY: Record<string, Collector> = {
  [worldNewsCollector.slug]: worldNewsCollector,
  [arxivCollector.slug]: arxivCollector,
  [huggingFacePapersCollector.slug]: huggingFacePapersCollector,
  [githubCollector.slug]: githubCollector,
};

/**
 * Get a collector by slug.
 */
export function getCollector(slug: string): Collector | null {
  return COLLECTOR_REGISTRY[slug] ?? null;
}

/**
 * List all registered collectors.
 */
export function listCollectors(): Collector[] {
  return Object.values(COLLECTOR_REGISTRY);
}
