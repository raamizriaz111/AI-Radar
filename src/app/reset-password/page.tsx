'use client';

// =============================================================================
// AI Radar — Professional Password Reset Completion Page
// =============================================================================

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    // Check query params for errors
    const paramError = searchParams.get('error') || searchParams.get('error_description');
    if (paramError) {
      setError(paramError);
      setValidatingSession(false);
      return;
    }

    // Check hash fragment for implicit flow
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const token = params.get('access_token');
      const type = params.get('type');

      if (token) {
        setAccessToken(token);
        if (type === 'recovery') {
          setHasValidSession(true);
          setValidatingSession(false);
          return;
        }
      }
    }

    // Check if code exchange is needed from search params
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeErr }) => {
        if (!mounted) return;
        if (!exchangeErr && data?.session) {
          setHasValidSession(true);
        } else {
          setError(exchangeErr?.message || 'Invalid or expired reset token.');
        }
        setValidatingSession(false);
      });
      return;
    }

    // Check active user session
    supabase.auth.getUser().then(({ data: { user }, error: userErr }) => {
      if (!mounted) return;
      if (!userErr && user) {
        setHasValidSession(true);
      } else {
        // Fallback check against API me endpoint
        fetch('/api/auth/me')
          .then((res) => res.json())
          .then((authData) => {
            if (!mounted) return;
            if (authData?.user) {
              setHasValidSession(true);
            }
          })
          .catch(() => {})
          .finally(() => {
            if (mounted) setValidatingSession(false);
          });
        return;
      }
      setValidatingSession(false);
    });

    // Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setHasValidSession(true);
        setValidatingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Update password client-side if session is in browser client
      let clientUpdated = false;
      try {
        const { error: clientErr } = await supabase.auth.updateUser({ password });
        if (!clientErr) {
          clientUpdated = true;
        }
      } catch {
        // Continue to server endpoint
      }

      // 2. Also execute server-side update to ensure session cookies are synced
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ password, accessToken }),
      });

      const data = await res.json();
      if (!res.ok && !clientUpdated) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please try requesting a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {validatingSession ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 size={32} className="animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-foreground">Verifying recovery credentials…</p>
          <p className="text-xs text-muted-foreground mt-1">Please hold on while we secure your session.</p>
        </div>
      ) : success ? (
        <div className="space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Password updated!</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Your password has been changed successfully. You can now use your new password to sign in to AI Radar.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login?reset=success"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-center"
            >
              <span>Continue to Sign in</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : hasValidSession ? (
        <>
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Please enter and confirm your new password below.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 p-3.5 text-sm text-red-400">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="password">
                New password
              </label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  autoFocus
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 6 || !confirmPassword}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Updating password…</span>
                </>
              ) : (
                <>
                  <span>Reset password</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        /* Expired or invalid link state */
        <div className="space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertCircle size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset link expired or invalid</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              For your security, password recovery links are single-use and expire after a short duration.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-center"
            >
              <span>Request new reset link</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] py-3 text-sm font-medium text-foreground hover:bg-white/[0.06] hover:border-white/[0.15] transition-all text-center"
            >
              <span>Return to Sign in</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── LEFT PANEL ──────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-card/60 p-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-600/6 blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
                <path d="M4 6h.01" />
                <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
                <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />
                <path d="M12 18h.01" />
                <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />
                <circle cx="12" cy="12" r="2" />
                <path d="m13.41 10.59 5.66-5.66" />
              </svg>
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-foreground leading-none">AI Radar</span>
              <span className="block text-[10px] font-mono text-muted-foreground/60 tracking-wider uppercase">Account Protection</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary font-mono">
              <KeyRound size={12} />
              <span>Password Security</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Choose your new<br />
              <span className="text-primary">secure credentials.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Use a strong combination of letters, numbers, and symbols to safeguard your personal intelligence stream and research bookmarks.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-muted-foreground/50 font-mono">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Encrypted storage · Direct session authorization</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" /><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /><path d="M12 18h.01" /><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /><circle cx="12" cy="12" r="2" /><path d="m13.41 10.59 5.66-5.66" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">AI Radar</span>
          </Link>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-foreground">Loading…</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
