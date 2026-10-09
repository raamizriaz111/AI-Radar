import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/validation/schemas';
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route';
import { GET as authCallbackHandler } from '@/app/auth/callback/route';

describe('Password Recovery Suite', () => {
  describe('Schema Validation', () => {
    it('accepts valid email for ForgotPasswordSchema', () => {
      const valid = { email: 'user@example.com' };
      const result = ForgotPasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects invalid email for ForgotPasswordSchema', () => {
      const invalid = { email: 'not-an-email' };
      const result = ForgotPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty email for ForgotPasswordSchema', () => {
      const invalid = { email: '' };
      const result = ForgotPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts valid password for ResetPasswordSchema', () => {
      const valid = { password: 'strongPassword123' };
      const result = ResetPasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('strongPassword123');
      }
    });

    it('rejects passwords shorter than 6 characters for ResetPasswordSchema', () => {
      const invalid = { password: '12345' };
      const result = ResetPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns 400 when email format is invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
        body: JSON.stringify({ email: 'bad-email' }),
      });

      const res = await forgotPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.ok).toBe(false);
    });

    it('returns positive status for valid email input', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.42' },
        body: JSON.stringify({ email: 'member.test@airadar.dev' }),
      });

      const res = await forgotPasswordHandler(req);
      const json = await res.json();

      // Either 200 or 429 if Supabase cooldown triggers
      if (res.status === 200) {
        expect(json.ok).toBe(true);
        expect(json.message).toBeDefined();
      } else {
        expect(res.status).toBe(429);
      }
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('rejects short passwords with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.88' },
        body: JSON.stringify({ password: '123' }),
      });

      const res = await resetPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.ok).toBe(false);
    });

    it('rejects unauthenticated password reset requests without a valid session', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.89' },
        body: JSON.stringify({ password: 'newSecurePassword123' }),
      });

      const res = await resetPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.ok).toBe(false);
      expect(json.error).toContain('invalid or has expired');
    });

    it('successfully resets password when user session is active', async () => {
      const { setMockSession, clearMockSession } = await import('@/lib/auth/session');
      setMockSession({
        id: 'test-recovery-user-1',
        email: 'recovery@example.com',
        role: 'user',
        name: 'Recovery Test User',
      });

      const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.90' },
        body: JSON.stringify({ password: 'brandNewSecurePass2026' }),
      });

      const res = await resetPasswordHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.message).toContain('successfully');

      clearMockSession();
    });
  });

  describe('GET /auth/callback', () => {
    it('redirects to /login with error if provider reports error', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?error=access_denied&error_description=Token+expired',
        { method: 'GET' }
      );

      const res = await authCallbackHandler(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('Token+expired');
    });

    it('redirects to next destination (defaulting to /reset-password) on valid callback call', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=/reset-password', {
        method: 'GET',
      });

      const res = await authCallbackHandler(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/reset-password');
    });
  });
});
