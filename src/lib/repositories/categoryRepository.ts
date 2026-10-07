// =============================================================================
// AI Radar — Category Repository
// =============================================================================
// Data access layer for categories.
// =============================================================================

import { isDatabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { type CategoryRow } from '@/lib/database.types';
import { logger } from '@/lib/services/logger';

// Default static fallback categories when DB is not yet connected
const FALLBACK_CATEGORIES: CategoryRow[] = [
  { id: '1', slug: 'ai-news', label: 'AI News', description: 'Announcements, releases, and industry developments', sort_order: 1, created_at: new Date().toISOString() },
  { id: '2', slug: 'ai-tools', label: 'AI Tools', description: 'New and notable AI-powered tools and applications', sort_order: 2, created_at: new Date().toISOString() },
  { id: '3', slug: 'models', label: 'Models & Research', description: 'Foundation models, benchmarks, and research papers', sort_order: 3, created_at: new Date().toISOString() },
  { id: '4', slug: 'coding-agents', label: 'Coding Agents', description: 'AI coding assistants, agent frameworks, and developer automation', sort_order: 4, created_at: new Date().toISOString() },
  { id: '5', slug: 'emerging-trends', label: 'Emerging Trends', description: 'Recurring signals detected across multiple independent sources', sort_order: 5, created_at: new Date().toISOString() },
  { id: '6', slug: 'career', label: 'Career & Projects', description: 'Skills, learning paths, and project ideas from real developments', sort_order: 6, created_at: new Date().toISOString() },
  { id: '7', slug: 'business', label: 'Business', description: 'Customer problems and AI-enabled solutions based on evidence', sort_order: 7, created_at: new Date().toISOString() },
  { id: '8', slug: 'safety-regulation', label: 'Safety & Regulation', description: 'AI safety research, policy, and regulatory developments', sort_order: 8, created_at: new Date().toISOString() },
];

export async function getCategories(): Promise<CategoryRow[]> {
  if (!isDatabaseConfigured()) {
    return FALLBACK_CATEGORIES;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      logger.error('Failed to fetch categories from database', error);
      return FALLBACK_CATEGORIES;
    }

    return data && data.length > 0 ? data : FALLBACK_CATEGORIES;
  } catch (err) {
    logger.error('Unexpected error fetching categories', err);
    return FALLBACK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}
