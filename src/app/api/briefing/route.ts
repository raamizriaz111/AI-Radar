// =============================================================================
// AI Radar — Daily Briefing API Route (Phase 7 Multi-User)
// GET /api/briefing & POST /api/briefing
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getLatestBriefing,
  getBriefingByDate,
  getBriefingHistory,
} from '@/lib/repositories/briefingRepository';
import { generateDailyBriefing } from '@/lib/intelligence/briefingService';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserProfile } from '@/lib/repositories/personalizationRepository';
import { buildPersonalizedBriefingSection } from '@/lib/personalization/personalBriefingService';
import { getItems } from '@/lib/repositories/itemRepository';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { logAiUsage, checkUsageLimit } from '@/lib/services/usageService';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.COLLECTION_SECRET;
  const isDev = process.env.NODE_ENV === 'development';

  if (secret) {
    const providedSecret = request.headers.get('x-collection-secret');
    if (providedSecret === secret) return true;
  }

  if (isDev) return true;

  // Allow requests from same host/origin (e.g. browser UI actions)
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (host && (origin?.includes(host) || referer?.includes(host) || host.includes('localhost') || host.includes('127.0.0.1'))) {
    return true;
  }

  // If no secret is explicitly configured, allow standalone execution
  if (!secret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  const rateLimit = checkRateLimit(ip, 'briefing');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimit.error },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const wantHistory = searchParams.get('history') === 'true';
    const wantPersonalized = searchParams.get('personalized') === 'true';

    if (wantHistory) {
      const history = await getBriefingHistory(14);
      return NextResponse.json({ ok: true, history });
    }

    if (date) {
      const briefing = await getBriefingByDate(date);
      if (!briefing) {
        return NextResponse.json(
          { ok: false, error: `No briefing found for date: ${date}` },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, briefing });
    }

    // Default: Return latest global briefing
    let latest = await getLatestBriefing();
    if (!latest) {
      latest = (await generateDailyBriefing()) as any;
    }

    // Optional user-scoped personalization augmentation
    let personalizedSection = null;
    if (wantPersonalized) {
      const user = await getCurrentUser();
      const profile = await getUserProfile(user?.id);
      const { data: recentItems } = await getItems({ pageSize: 50 });
      personalizedSection = buildPersonalizedBriefingSection(recentItems, profile, user?.id);

      if (user?.id) {
        await logAiUsage({
          userId: user.id,
          operationType: 'briefing',
          provider: 'system',
          model: 'personal-briefing-v1',
          promptVersion: '1.0.0',
          tokensUsed: 120,
          isCached: false,
          status: 'success',
          costEstimateUsd: 0.0002,
          metadata: { date: latest?.briefing_date },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      briefing: latest,
      personalizedSection,
    });
  } catch (err: any) {
    logger.error('Failed to get briefing', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide x-collection-secret header.' },
      { status: 401 }
    );
  }

  const user = await getCurrentUser();
  if (user?.id) {
    const limitCheck = await checkUsageLimit(user.id, 'briefing');
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: limitCheck.reason },
        { status: 429 }
      );
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const date = body.date || new Date().toISOString().slice(0, 10);
    const force = body.force ?? true;

    const briefing = await generateDailyBriefing({ date, force });

    if (user?.id) {
      await logAiUsage({
        userId: user.id,
        operationType: 'briefing',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
        promptVersion: '1.0.0',
        tokensUsed: 850,
        isCached: false,
        status: 'success',
        costEstimateUsd: 0.0025,
      });
    }

    return NextResponse.json({
      ok: true,
      briefing,
    });
  } catch (err: any) {
    logger.error('Failed to generate daily briefing', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
