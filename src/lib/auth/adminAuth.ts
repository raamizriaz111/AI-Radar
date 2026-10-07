// =============================================================================
// AI Radar — Admin Authentication & Token Verification
// =============================================================================

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'ai_radar_admin_token';
const DEFAULT_ADMIN_PASSKEY = process.env.ADMIN_PASSWORD || 'radar_admin_2026';

/**
 * Validates the provided admin passcode.
 */
export function verifyAdminPasskey(passkey: string): boolean {
  if (!passkey) return false;
  const expected = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSKEY;
  return passkey.trim() === expected.trim();
}

/**
 * Checks if the current request has a valid admin session cookie.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token && token.startsWith('admin_session_valid')) {
      return true;
    }

    // Also verify if current Supabase user is the system owner/builder
    try {
      const { isDatabaseConfigured } = await import('@/lib/supabase/config');
      if (isDatabaseConfigured()) {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const ownerEmail = (process.env.OWNER_EMAIL || 'raamizriaz111@gmail.com').toLowerCase().trim();
        if (user?.email && user.email.toLowerCase().trim() === ownerEmail) {
          return true;
        }
      }
    } catch {}

    return false;
  } catch {
    return false;
  }
}

/**
 * Sets the admin session cookie on response.
 */
export async function setAdminSessionCookie(): Promise<string> {
  const token = `admin_session_valid_${Date.now()}`;
  const cookieStore = await cookies();

  // Only enforce secure cookies if explicitly enabled or if running on an HTTPS domain
  const isSecure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.NODE_ENV === 'production' &&
      Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')));

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

/**
 * Clears the admin session cookie.
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
