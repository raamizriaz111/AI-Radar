// =============================================================================
// AI Radar — Authentication & Session Layer (Phase 7)
// =============================================================================
// Handles server-side user resolution, session verification, and role checks.
// Integrates with Supabase Auth via @supabase/ssr cookies, with fallback
// in-memory session management for offline testing and development.
// =============================================================================

import { isDatabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { AuthUser } from '@/lib/types';
import { logger } from '@/lib/services/logger';
import { registerBuilderUserId } from '@/lib/billing/subscriptionService';

export const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ||
  process.env.BUILDER_EMAIL ||
  'raamizriaz111@gmail.com'
).toLowerCase().trim();

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === OWNER_EMAIL;
}

// In-memory mock session for testing and offline development
let mockSessionUser: AuthUser | null = null;

/**
 * Sets the mock session user for testing or offline environments.
 */
export function setMockSession(user: AuthUser | null): void {
  mockSessionUser = user;
}

/**
 * Gets the current mock session user.
 */
export function getMockSession(): AuthUser | null {
  return mockSessionUser;
}

/**
 * Clears the mock session user.
 */
export function clearMockSession(): void {
  mockSessionUser = null;
}

/**
 * Retrieves the currently authenticated user from Supabase session cookies
 * or active test session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // Check mock session first (used in vitest unit/integration tests)
  if (mockSessionUser) {
    if (isOwnerEmail(mockSessionUser.email)) {
      registerBuilderUserId(mockSessionUser.id);
      return {
        ...mockSessionUser,
        role: 'admin',
        name: mockSessionUser.name || 'Raamiz (Builder)',
      };
    }
    return mockSessionUser;
  }

  // Check admin passkey session cookie
  try {
    const { isAdminAuthenticated } = await import('@/lib/auth/adminAuth');
    const isPasskeyAdmin = await isAdminAuthenticated();
    if (isPasskeyAdmin) {
      registerBuilderUserId('admin-passkey-user');
      return {
        id: 'admin-passkey-user',
        email: OWNER_EMAIL,
        role: 'admin',
        name: 'Raamiz (Builder)',
      };
    }
  } catch {}

  if (!isDatabaseConfigured()) {
    // If database is not configured and no mock session is set,
    // return null so unauthenticated flows can be verified.
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Check application session cookie as secondary fallback
      return await getAppCookieUser();
    }

    const isOwner = isOwnerEmail(user.email);
    if (isOwner) {
      registerBuilderUserId(user.id);
    }

    return {
      id: user.id,
      email: user.email,
      role: isOwner
        ? 'admin'
        : (user.user_metadata?.role as string) || (user.app_metadata?.role as string) || 'user',
      name: isOwner
        ? (user.user_metadata?.name as string) || 'Raamiz (Builder)'
        : (user.user_metadata?.name as string) || user.email?.split('@')[0],
    };
  } catch (err) {
    logger.debug('Failed to get authenticated user from session', err instanceof Error ? { error: err.message } : undefined);
    return await getAppCookieUser();
  }
}

async function getAppCookieUser(): Promise<AuthUser | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('ai_radar_session')?.value;
    if (token) {
      const { parseSessionToken } = await import('@/lib/auth/sessionCookie');
      const payload = parseSessionToken(token);
      if (payload) {
        if (payload.role === 'admin' || isOwnerEmail(payload.email)) {
          registerBuilderUserId(payload.id);
        }
        return {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          name: payload.name || payload.email.split('@')[0],
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Enforces authentication. Returns AuthUser if authenticated, throws Error otherwise.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error('Authentication required');
    (err as any).status = 401;
    throw err;
  }
  return user;
}

/**
 * Enforces admin authorization.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    const err = new Error('Admin authorization required');
    (err as any).status = 403;
    throw err;
  }
  return user;
}
