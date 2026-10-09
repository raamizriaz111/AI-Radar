// =============================================================================
// AI Radar — Supabase Auth Callback Route
// GET /auth/callback
// =============================================================================
// Exchanges auth code for an active session upon clicking magic links or
// password reset recovery emails.
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setAppSessionCookie } from '@/lib/auth/sessionCookie';
import { getUserProfile } from '@/lib/repositories/personalizationRepository';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/reset-password';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    logger.warn('Auth callback error reported by auth provider', { error, errorDescription });
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        logger.error('Failed to exchange auth code for session', exchangeError);
        const redirectUrl = new URL('/reset-password', request.url);
        redirectUrl.searchParams.set('error', exchangeError.message);
        return NextResponse.redirect(redirectUrl);
      }

      if (data?.user) {
        const profile = await getUserProfile(data.user.id);
        await setAppSessionCookie({
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.email?.split('@')[0],
          role: data.user.user_metadata?.role || 'user',
        });
      }
    } catch (err: any) {
      logger.error('Auth callback exception during code exchange', err);
    }
  }

  // Redirect to requested destination (defaults to /reset-password)
  const targetUrl = new URL(next, request.url);
  return NextResponse.redirect(targetUrl);
}
