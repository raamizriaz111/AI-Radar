// =============================================================================
// AI Radar — Auth Reset Password API Route
// POST /api/auth/reset-password
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { ResetPasswordSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { setAppSessionCookie } from '@/lib/auth/sessionCookie';
import { getUserProfile } from '@/lib/repositories/personalizationRepository';
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
    const validated = ResetPasswordSchema.parse(body);

    if (isDatabaseConfigured()) {
      const supabase = await createClient();

      // 1. Check if user is authenticated via active SSR session
      let {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. If no user in cookie, check Authorization header (e.g. Bearer <accessToken> from client-side recovery)
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const accessToken = bearerToken || body.accessToken;

      if (!user && accessToken) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const directClient = createDirectClient(url, anonKey);
        const { data: tokenData } = await directClient.auth.getUser(accessToken);
        if (tokenData?.user) {
          user = tokenData.user;
          // Update password using the direct token client
          const { error: directUpdateError } = await directClient.auth.updateUser(
            { password: validated.password },
            // Pass auth headers or session if needed
          );
          if (directUpdateError && isServiceKeyConfigured()) {
            // Fallback to service client to update by ID
            const { createServiceClient } = await import('@/lib/supabase/service');
            const serviceClient = createServiceClient();
            await serviceClient.auth.admin.updateUserById(user.id, {
              password: validated.password,
            });
          }
        }
      }

      // 3. If user found via cookie session, update password
      if (user) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: validated.password,
        });

        if (updateError) {
          // If SSR update failed, attempt admin service client update
          if (isServiceKeyConfigured()) {
            const { createServiceClient } = await import('@/lib/supabase/service');
            const serviceClient = createServiceClient();
            const { error: adminUpdateErr } = await serviceClient.auth.admin.updateUserById(
              user.id,
              { password: validated.password }
            );
            if (adminUpdateErr) {
              logger.error('Admin password update failed', adminUpdateErr);
              return NextResponse.json(
                { ok: false, error: updateError.message },
                { status: 400 }
              );
            }
          } else {
            logger.error('Supabase password update failed', updateError);
            return NextResponse.json(
              { ok: false, error: updateError.message },
              { status: 400 }
            );
          }
        }

        const profile = await getUserProfile(user.id);
        await setAppSessionCookie({
          id: user.id,
          email: user.email!,
          name: profile?.name || user.email?.split('@')[0],
          role: user.user_metadata?.role || 'user',
        });

        logger.info('Password reset completed successfully for user', { userId: user.id });
        return NextResponse.json({
          ok: true,
          message: 'Your password has been successfully updated.',
        });
      }

      // No active session or user found
      return NextResponse.json(
        {
          ok: false,
          error:
            'Password reset link is invalid or has expired. Please request a new link.',
        },
        { status: 401 }
      );
    }

    // Mock fallback for offline tests: verify mock session
    const { getCurrentUser } = await import('@/lib/auth/session');
    const mockUser = await getCurrentUser();
    if (!mockUser) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Password reset link is invalid or has expired. Please request a new link.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Password updated successfully (development mock mode).',
    });
  } catch (err: any) {
    logger.error('Reset password API exception', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
