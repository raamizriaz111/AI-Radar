// =============================================================================
// AI Radar — Auth Forgot Password API Route
// POST /api/auth/forgot-password
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { ForgotPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  const rateLimit = checkRateLimit(ip, 'auth');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimit.error },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const validated = ForgotPasswordSchema.parse(body);
    const cleanEmail = validated.email.trim().toLowerCase();

    // Determine the base origin for redirect
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin;
    const redirectTo = `${origin}/auth/callback?next=/reset-password`;

    if (isDatabaseConfigured()) {
      const supabase = await createClient();

      // Check user existence if service role is available to provide helpful feedback
      if (isServiceKeyConfigured()) {
        try {
          const { createServiceClient } = await import('@/lib/supabase/service');
          const serviceClient = createServiceClient();
          const { data: userList } = await serviceClient.auth.admin.listUsers();
          const exists = userList?.users?.some(
            (u) => u.email?.toLowerCase().trim() === cleanEmail
          );

          if (!exists) {
            // OWASP standard: Respond positively to prevent account enumeration
            return NextResponse.json({
              ok: true,
              message: 'If an account exists with this email address, a password reset link has been dispatched.',
            });
          }
        } catch (adminErr) {
          logger.warn('Service client check failed during forgot-password', { error: String(adminErr) });
        }
      }

      // Dispatch reset email via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        // Handle Supabase 60-second security cooldown
        if (
          error.status === 429 ||
          error.message.toLowerCase().includes('security purposes') ||
          error.message.toLowerCase().includes('rate limit')
        ) {
          return NextResponse.json(
            {
              ok: false,
              error: 'For security purposes, you can only request a password reset once every 60 seconds. Please check your inbox and spam folder or try again in a moment.',
            },
            { status: 429 }
          );
        }

        logger.error('Failed to send password reset email', error);
        return NextResponse.json(
          { ok: false, error: error.message || 'Failed to dispatch password reset email.' },
          { status: 400 }
        );
      }

      logger.info('Password reset email dispatched successfully to user', { email: cleanEmail });
      return NextResponse.json({
        ok: true,
        message: 'Password reset link sent to your email. Please check your inbox.',
      });
    }

    // Mock fallback for offline local tests
    logger.info('Forgot password requested in offline/mock mode', { email: cleanEmail });
    return NextResponse.json({
      ok: true,
      message: 'Password reset link sent (development mock mode).',
    });
  } catch (err: any) {
    logger.error('Forgot password API exception', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
