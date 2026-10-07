// =============================================================================
// AI Radar — Auth Sign Up API Route (Phase 7)
// POST /api/auth/signup
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SignUpSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { saveUserProfile } from '@/lib/repositories/personalizationRepository';
import { updateUserPlan, DEFAULT_FREE_PLAN } from '@/lib/services/usageService';
import { setMockSession } from '@/lib/auth/session';
import { setAppSessionCookie } from '@/lib/auth/sessionCookie';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting (10 requests per minute for auth)
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
    const validated = SignUpSchema.parse(body);

    if (isDatabaseConfigured()) {
      let userId: string | null = null;
      let directCreated = false;

      // 1. If service key is available, create user with email_confirm: true directly
      // This bypasses free-tier SMTP rate limits and allows instant login without waiting for email.
      if (isServiceKeyConfigured()) {
        try {
          const serviceClient = createServiceClient();
          const { data: adminData, error: adminError } = await serviceClient.auth.admin.createUser({
            email: validated.email,
            password: validated.password,
            email_confirm: true,
            user_metadata: {
              name: validated.name || validated.email.split('@')[0],
            },
          });

          if (adminError) {
            if (adminError.message.toLowerCase().includes('already been registered')) {
              return NextResponse.json(
                { ok: false, error: 'An account with this email address already exists. Please sign in.' },
                { status: 400 }
              );
            }
            logger.warn('Admin user creation warning, falling back to standard signUp', { error: adminError.message });
          } else if (adminData?.user) {
            userId = adminData.user.id;
            directCreated = true;
          }
        } catch (adminErr) {
          logger.warn('Service client createUser threw error, falling back', { error: String(adminErr) });
        }
      }

      const supabase = await createClient();

      // 2. Fallback to standard signUp if not direct-created
      if (!directCreated) {
        const { data, error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              name: validated.name || validated.email.split('@')[0],
            },
          },
        });

        if (error) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        }
        userId = data.user?.id || null;
      }

      // 3. Immediately establish browser session cookies
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      const finalUserId = userId || signInData?.user?.id;

      if (finalUserId) {
        // Initialize user profile and free tier plan
        try {
          await saveUserProfile(
            {
              name: validated.name || validated.email.split('@')[0],
            },
            finalUserId
          );
          await updateUserPlan(finalUserId, DEFAULT_FREE_PLAN);
        } catch (profileErr) {
          logger.warn('Error saving initial user profile on signup', { error: String(profileErr) });
        }

        await setAppSessionCookie({
          id: finalUserId,
          email: validated.email,
          name: validated.name || validated.email.split('@')[0],
          role: 'user',
        });
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: finalUserId,
          email: validated.email,
          name: validated.name || validated.email.split('@')[0],
        },
        requiresEmailConfirmation: false,
      });
    }

    // In-memory offline fallback for tests & local development
    const mockUserId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const mockUser = {
      id: mockUserId,
      email: validated.email,
      name: validated.name || validated.email.split('@')[0],
      role: 'user',
    };

    setMockSession(mockUser);
    await saveUserProfile({ name: mockUser.name }, mockUserId);
    await updateUserPlan(mockUserId, DEFAULT_FREE_PLAN);
    await setAppSessionCookie({
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    });

    return NextResponse.json({
      ok: true,
      user: mockUser,
      requiresEmailConfirmation: false,
    });
  } catch (err: any) {
    logger.error('Sign up error', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to sign up' },
      { status: 400 }
    );
  }
}
