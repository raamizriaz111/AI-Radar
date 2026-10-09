'use client';

// =============================================================================
// AI Radar — Professional Forgot Password Page
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, Clock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch password reset email.');
      }

      setSubmitted(true);
      setCountdown(60);
      // Run countdown timer for resend cooldown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── LEFT PANEL: Recovery Security & Identity ────────────────── */}
      <div className="relative hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-card/60 p-12">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-600/6 blur-[100px]" />
        </div>

        {/* Logo */}
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

        {/* Hero headline */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary font-mono">
              <KeyRound size={12} />
              <span>Cryptographic Account Recovery</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Seamless and secure<br />
              <span className="text-primary">password reset.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              We deliver an encrypted, single-use authentication link directly to your inbox so you can safely regain access to your intelligence desk.
            </p>
          </div>

          {/* Recovery assurances */}
          <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Zero-Exposure Security</p>
                <p className="text-[11px] text-muted-foreground/70">Your password is never transmitted in plain text or shared across sessions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock size={14} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Time-Limited Tokens</p>
                <p className="text-[11px] text-muted-foreground/70">Reset links expire automatically to protect your account against unauthorized recovery.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="relative z-10 flex items-center gap-2 text-[11px] text-muted-foreground/50 font-mono">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Verified email security · OWASP rate-limited</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form or Success State ────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16">

        {/* Mobile header */}
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

        <div className="w-full max-w-sm">

          {/* Back link */}
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Sign in</span>
          </Link>

          {!submitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Forgot password?</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 p-3.5 text-sm text-red-400">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Request form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="you@gmail.com"
                      className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Sending reset link…</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success confirmation state */
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We&apos;ve sent a password reset link to{' '}
                  <span className="font-semibold text-foreground underline decoration-white/20 underline-offset-2">{email}</span>.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs text-muted-foreground/80 space-y-2">
                <p>
                  Click the link in the email to set a new password. If you don&apos;t see the email within a couple minutes, please check your spam or junk folder.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={countdown > 0 || loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] py-3 text-sm font-medium text-foreground hover:bg-white/[0.06] hover:border-white/[0.15] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {countdown > 0 ? (
                    <span>Resend email in {countdown}s</span>
                  ) : (
                    <span>Resend email</span>
                  )}
                </button>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-center"
                >
                  <span>Return to Sign in</span>
                </Link>
              </div>
            </div>
          )}

          {/* Bottom sign-in prompt */}
          {!submitted && (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
