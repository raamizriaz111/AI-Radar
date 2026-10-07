import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookie';

describe('Auth & Route Protection Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(path: string, cookies: Record<string, string> = {}) {
    const url = `http://localhost:3000${path}`;
    const headers = new Headers();
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }

    return new NextRequest(url, { headers });
  }

  describe('Unauthenticated Visitors', () => {
    it('redirects root / to /login', async () => {
      const req = createMockRequest('/');
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects /briefing to /login with redirect parameter', async () => {
      const req = createMockRequest('/briefing');
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fbriefing');
    });

    it('redirects /account/billing?plan=pro preserving query parameters', async () => {
      const req = createMockRequest('/account/billing?plan=pro');
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Faccount%2Fbilling%3Fplan%3Dpro');
    });

    it('allows access to public /login page', async () => {
      const req = createMockRequest('/login');
      const res = await middleware(req);

      // NextResponse.next() returns status 200 without redirect location
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('allows access to public /signup page', async () => {
      const req = createMockRequest('/signup');
      const res = await middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('allows access to public /terms and /privacy pages', async () => {
      const termsReq = createMockRequest('/terms');
      const termsRes = await middleware(termsReq);
      expect(termsRes.status).toBe(200);

      const privacyReq = createMockRequest('/privacy');
      const privacyRes = await middleware(privacyReq);
      expect(privacyRes.status).toBe(200);
    });

    it('allows access to public auth APIs', async () => {
      const loginApiReq = createMockRequest('/api/auth/login');
      const loginApiRes = await middleware(loginApiReq);
      expect(loginApiRes.status).toBe(200);

      const signupApiReq = createMockRequest('/api/auth/signup');
      const signupApiRes = await middleware(signupApiReq);
      expect(signupApiRes.status).toBe(200);
    });

    it('blocks unauthenticated requests to protected APIs with 401', async () => {
      const req = createMockRequest('/api/protected-data');
      const res = await middleware(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain('Authentication required');
    });

    it('passes through static files and next assets', async () => {
      const iconReq = createMockRequest('/icon.svg');
      const iconRes = await middleware(iconReq);
      expect(iconRes.status).toBe(200);

      const nextStaticReq = createMockRequest('/_next/static/chunks/main.js');
      const nextStaticRes = await middleware(nextStaticReq);
      expect(nextStaticRes.status).toBe(200);
    });
  });

  describe('Authenticated Users', () => {
    const validSessionToken = createSessionToken({
      id: 'test-user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
    });

    it('allows authenticated user with session cookie to access dashboard /', async () => {
      const req = createMockRequest('/', {
        [SESSION_COOKIE_NAME]: validSessionToken,
      });
      const res = await middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('allows authenticated user with admin passkey cookie to access dashboard /', async () => {
      const req = createMockRequest('/', {
        ai_radar_admin_token: 'admin_session_valid_1234567890',
      });
      const res = await middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('redirects authenticated user visiting /login to /', async () => {
      const req = createMockRequest('/login', {
        [SESSION_COOKIE_NAME]: validSessionToken,
      });
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('redirects authenticated user visiting /login?redirect=/briefing to /briefing', async () => {
      const req = createMockRequest('/login?redirect=%2Fbriefing', {
        [SESSION_COOKIE_NAME]: validSessionToken,
      });
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/briefing');
    });
  });
});
