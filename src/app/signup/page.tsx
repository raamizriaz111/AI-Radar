'use client';

// =============================================================================
// AI Radar — Professional Create Account Page
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, Check } from 'lucide-react';

const PLAN_PERKS = [
  'Live AI news stream & breaking alerts',
  'Daily 5-minute executive briefing',
  'Research papers & model tracking',
  'AI tools & coding agent directory',
  'Emerging trend detection',
  'Safety & regulatory updates',
];

export default function SignUpPage() {
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account.');

      window.location.href = '/onboarding';
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const passwordStrong = password.length >= 8;

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── LEFT PANEL: What's included ──────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-card/60 p-12">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-600/6 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/25">
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
            <span className="block text-[10px] font-mono text-muted-foreground/60 tracking-wider uppercase">Real-Time Intelligence</span>
          </div>
        </div>

        {/* Headline + perks */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Your intelligence<br />
              <span className="text-primary">edge starts here.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Free account. No credit card required. Access the full intelligence feed from day one.
            </p>
          </div>

          {/* Perk checklist */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">Included free</p>
            <ul className="space-y-2.5">
              {PLAN_PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-foreground/80">{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Social proof */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              &ldquo;AI Radar is the only tool I check before my morning stand-up. It surfaces research I would&apos;ve missed for days.&rdquo;
            </p>
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground/60">— ML Engineer, Tier-1 tech company</p>
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 text-[11px] text-muted-foreground/40 font-mono">
          Primary sources only · No fabricated data · Unsubscribe anytime
        </div>
      </div>

      {/* ── RIGHT PANEL: Create Account Form ─────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16">

        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" /><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /><path d="M12 18h.01" /><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /><circle cx="12" cy="12" r="2" /><path d="m13.41 10.59 5.66-5.66" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">AI Radar</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Back link */}
          <Link
            href="/login"
            className="mb-7 inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to sign in</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Free forever. No credit card needed.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 p-3.5 text-sm text-red-400">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="name">
                Your name
              </label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="Alex Chen"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
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
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="At least 8 characters"
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
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-8 rounded-full transition-all ${
                          password.length >= i * 3
                            ? i === 3 ? 'bg-emerald-500' : i === 2 ? 'bg-amber-500' : 'bg-red-500'
                            : 'bg-white/[0.1]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">
                    {password.length < 4 ? 'Weak' : password.length < 8 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || password.length < 6}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </form>

          {/* Legal */}
          <p className="mt-5 text-center text-[11px] text-muted-foreground/40 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:text-muted-foreground transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-muted-foreground transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
