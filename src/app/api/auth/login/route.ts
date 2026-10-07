// =============================================================================
// AI Radar — Auth Sign In API Route (Phase 7)
// POST /api/auth/login
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { SignInSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { setMockSession } from '@/lib/auth/session';
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
    const validated = SignInSchema.parse(body);

    if (isDatabaseConfigured()) {
      const supabase = await createClient();
      let { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      // 1. Auto-handle demo user if not yet initialized in Supabase
      if (error && (validated.email === 'demo@airadar.dev' || validated.email.endsWith('@airadar.dev'))) {
        try {
          const { createServiceClient } = await import('@/lib/supabase/service');
          const serviceClient = createServiceClient();
          await serviceClient.auth.admin.createUser({
            email: validated.email,
            password: validated.password,
            email_confirm: true,
            user_metadata: { name: 'Demo Analyst' },
          });

          const retry = await supabase.auth.signInWithPassword({
            email: validated.email,
            password: validated.password,
          });
          data = retry.data;
          error = retry.error;
        } catch (demoErr) {
          logger.warn('Failed to auto-provision demo user', { error: String(demoErr) });
        }
      }

      // 2. Auto-confirm if user registered earlier but Supabase SMTP blocked confirmation
      if (error && error.message.toLowerCase().includes('email not confirmed')) {
        try {
          const { createServiceClient } = await import('@/lib/supabase/service');
          const serviceClient = createServiceClient();
          const { data: userList } = await serviceClient.auth.admin.listUsers();
          const target = userList?.users?.find(
            (u) => u.email?.toLowerCase() === validated.email.toLowerCase()
          );
          if (target) {
            await serviceClient.auth.admin.updateUserById(target.id, { email_confirm: true });
            const retry = await supabase.auth.signInWithPassword({
              email: validated.email,
              password: validated.password,
            });
            data = retry.data;
            error = retry.error;
          }
        } catch (confirmErr) {
          logger.warn('Auto-confirm retry failed', { error: String(confirmErr) });
        }
      }

      if (error || !data?.user) {
        const errorMsg = error?.message.includes('Invalid login credentials')
          ? 'Invalid email or password. If you do not have an account, click Sign Up.'
          : error?.message || 'Authentication failed';
        return NextResponse.json({ ok: false, error: errorMsg }, { status: 401 });
      }

      const user = data.user;
      const profile = await getUserProfile(user.id);
      await setAppSessionCookie({
        id: user.id,
        email: user.email!,
        name: profile?.name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'user',
      });

      return NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: profile?.name || user.email?.split('@')[0],
        },
      });
    }

    // Offline test fallback
    const mockUser = {
      id: `user-${validated.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: validated.email,
      name: validated.email.split('@')[0],
      role: 'user',
    };
    setMockSession(mockUser);
    const profile = await getUserProfile(mockUser.id);
    await setAppSessionCookie({
      id: mockUser.id,
      email: mockUser.email,
      name: profile?.name || mockUser.name,
      role: mockUser.role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: profile?.name || mockUser.name,
      },
    });
  } catch (err: any) {
    logger.error('Login error', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Invalid credentials' },
      { status: 400 }
    );
  }
}
