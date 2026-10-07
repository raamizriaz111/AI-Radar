import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ItemFull } from './database.types';
import type { IntelligenceItemWithSummary } from './types';

/**
 * Merge Tailwind CSS classes without conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string as a relative human-readable string.
 * Returns a fallback if the date is invalid.
 */
export function safeFormatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}

/**
 * Maps a full database item (including relations & AI summary) into the
 * shape required by UI components like IntelligenceCard.
 */
export function mapItemToCardItem(item: ItemFull): IntelligenceItemWithSummary {
  return {
    id: item.id,
    sourceId: item.source_id,
    sourceName: item.source?.name ?? 'Source',
    sourceUrl: item.source?.base_url ?? item.canonical_url,
    externalId: item.external_id,
    canonicalUrl: item.canonical_url,
    title: item.title,
    description: item.description,
    author: Array.isArray(item.authors) && item.authors.length > 0 ? String(item.authors[0]) : null,
    publishedAt: item.published_at ?? item.created_at,
    discoveredAt: item.discovered_at,
    contentType: (item.item_type as any) ?? 'news',
    categories: item.categories.map((c) => c.slug as any),
    summary: item.summary ? {
      id: item.summary.id,
      itemId: item.id,
      content: item.summary.summary,
      model: item.summary.model_name,
      provider: item.summary.provider,
      generatedAt: item.summary.generated_at,
      version: 1,
      keyPoints: Array.isArray(item.summary.key_points) ? (item.summary.key_points as string[]) : [],
      significance: item.summary.significance,
      claims: Array.isArray(item.summary.claims) ? (item.summary.claims as any[]) : [],
      entities: Array.isArray(item.summary.entities) ? (item.summary.entities as any[]) : [],
      technologies: Array.isArray(item.summary.technologies) ? (item.summary.technologies as string[]) : [],
      topics: Array.isArray(item.summary.topics) ? (item.summary.topics as string[]) : [],
      confidence: typeof item.summary.confidence === 'number' ? item.summary.confidence : null,
      promptVersion: (item.summary as any).prompt_version ?? '1.0.0',
      warningFlags: Array.isArray((item.summary as any).warning_flags) ? ((item.summary as any).warning_flags as string[]) : [],
    } : null,
  };
}
