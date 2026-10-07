// =============================================================================
// API: GET /api/feedback/report — Intelligence Feedback & Quality Analysis (Phase 9)
// =============================================================================
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getUserFeedbackList } from '@/lib/repositories/personalizationRepository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const allFeedback = await getUserFeedbackList(undefined);

    const countsByType: Record<string, number> = {};
    const countsByEntity: Record<string, number> = {};
    const problemReports: Array<{ entityId: string; feedbackType: string; notes: string | null; date: string }> = [];

    for (const fb of allFeedback) {
      countsByType[fb.feedbackType] = (countsByType[fb.feedbackType] ?? 0) + 1;
      countsByEntity[fb.entityType] = (countsByEntity[fb.entityType] ?? 0) + 1;

      if (['incorrect', 'duplicate', 'poor_summary', 'missing_source', 'bad_recommendation', 'technical_issue', 'billing_issue'].includes(fb.feedbackType)) {
        problemReports.push({
          entityId: fb.entityId,
          feedbackType: fb.feedbackType,
          notes: fb.notes ?? null,
          date: fb.createdAt ?? new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      totalFeedback: allFeedback.length,
      countsByType,
      countsByEntityType: countsByEntity,
      problemReportsCount: problemReports.length,
      recentProblemReports: problemReports.slice(0, 20),
    });
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (err instanceof Error && (err as any).status === 403) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to generate feedback report' }, { status: 500 });
  }
}
