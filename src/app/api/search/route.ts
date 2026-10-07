// =============================================================================
// AI Radar — Unified Search API Route (Phase 7 Section 25)
// GET /api/search?q=query&type=all|items|trends|projects|topics
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getItems } from '@/lib/repositories/itemRepository';
import { getAllTrends } from '@/lib/repositories/trendRepository';
import {
  getProjectOpportunities,
  getLearningTopicsCatalog,
  getUserProfile,
} from '@/lib/repositories/personalizationRepository';
import { getCurrentUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { logAiUsage } from '@/lib/services/usageService';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  const rateLimit = checkRateLimit(ip, 'search');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimit.error },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type') || 'all';

  if (!q) {
    return NextResponse.json({
      ok: true,
      query: '',
      results: {
        items: [],
        trends: [],
        projects: [],
        learningTopics: [],
        total: 0,
      },
    });
  }

  try {
    const user = await getCurrentUser();
    const profile = await getUserProfile(user?.id);
    const queryLower = q.toLowerCase();

    // 1. Search items
    const { data: allItems } = await getItems({
      searchQuery: q,
      pageSize: 20,
    });

    // 2. Search trends
    const allTrends = await getAllTrends({ limit: 30 });
    const matchingTrends = allTrends.filter(
      (t) =>
        t.title.toLowerCase().includes(queryLower) ||
        t.description.toLowerCase().includes(queryLower)
    );

    // 3. Search projects
    const allProjects = await getProjectOpportunities(profile, user?.id);
    const matchingProjects = allProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(queryLower) ||
        p.problemStatement.toLowerCase().includes(queryLower) ||
        p.technicalStack.some((tech) => tech.toLowerCase().includes(queryLower))
    );

    // 4. Search learning topics
    const allTopics = await getLearningTopicsCatalog();
    const matchingTopics = allTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(queryLower) ||
        topic.summary.toLowerCase().includes(queryLower) ||
        topic.technologies.some((tech) => tech.toLowerCase().includes(queryLower))
    );

    // Telemetry log for search
    if (user?.id) {
      await logAiUsage({
        userId: user.id,
        operationType: 'search',
        provider: 'system',
        model: 'postgres-fts-v1',
        promptVersion: null,
        tokensUsed: 0,
        isCached: false,
        status: 'success',
        costEstimateUsd: 0,
        metadata: { query: q, type },
      });
    }

    const filteredResults = {
      items: type === 'all' || type === 'items' ? allItems : [],
      trends: type === 'all' || type === 'trends' ? matchingTrends : [],
      projects: type === 'all' || type === 'projects' ? matchingProjects : [],
      learningTopics: type === 'all' || type === 'topics' ? matchingTopics : [],
    };

    const total =
      filteredResults.items.length +
      filteredResults.trends.length +
      filteredResults.projects.length +
      filteredResults.learningTopics.length;

    return NextResponse.json({
      ok: true,
      query: q,
      results: {
        ...filteredResults,
        total,
      },
    });
  } catch (err: any) {
    logger.error('Search query error', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Search execution failed' },
      { status: 500 }
    );
  }
}
