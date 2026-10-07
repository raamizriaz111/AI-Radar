// =============================================================================
// AI Radar — Session Cookie & Token Management
// =============================================================================
// Provides lightweight, Edge-compatible session cookie encoding and decoding
// for instant, zero-latency authentication verification in Next.js middleware
// and Server Components, interoperating with Supabase SSR cookies.
// =============================================================================

import { cookies } from 'next/headers';
import { isOwnerEmail } from '@/lib/auth/session';

export const SESSION_COOKIE_NAME = 'ai_radar_session';

export interface SessionPayload {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: number;
}

/**
 * Encodes a user session payload into a base64 session token.
 */
export function createSessionToken(payload: {
  id: string;
  email: string;
  name?: string;
  role?: string;
}): string {
  const fullPayload: SessionPayload = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: isOwnerEmail(payload.email) ? 'admin' : payload.role === 'admin' ? 'admin' : 'user',
    createdAt: Date.now(),
  };
  return Buffer.from(JSON.stringify(fullPayload)).toString('base64');
}

/**
 * Decodes and validates a base64 session token.
 */
export function parseSessionToken(token?: string | null): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(jsonStr);
    if (!data || !data.id || !data.email) return null;
    return {
      id: String(data.id),
      email: String(data.email),
      name: data.name ? String(data.name) : undefined,
      role: isOwnerEmail(data.email) ? 'admin' : data.role === 'admin' ? 'admin' : 'user',
      createdAt: Number(data.createdAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Sets the application session cookie on the current HTTP response.
 */
export async function setAppSessionCookie(user: {
  id: string;
  email: string;
  name?: string;
  role?: string;
}): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = createSessionToken(user);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production' &&
        Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')),
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch {}
}

/**
 * Clears the application session cookie and admin token on logout.
 */
export async function clearAppSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete('ai_radar_admin_token');
  } catch {}
}
