'use client';

// =============================================================================
// AI Radar — Professional Sign In Page
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Newspaper, TrendingUp, Bot, FlaskConical, ShieldCheck, Radio } from 'lucide-react';

const FEATURE_BULLETS = [
  { icon: Radio,        label: 'Real-time AI intelligence', sub: 'Live feed across 20+ frontier sources' },
  { icon: Newspaper,    label: "5-Minute Executive Briefing", sub: 'Delivered every morning by 7 AM' },
  { icon: TrendingUp,   label: 'Emerging trend detection',   sub: 'Signals before they hit mainstream' },
  { icon: Bot,          label: 'AI Code Agent tracking',     sub: 'Cursor, Devin, Copilot and beyond' },
  { icon: FlaskConical, label: 'Research & model radar',     sub: 'arXiv, frontier weights, benchmarks' },
  { icon: ShieldCheck,  label: 'Safety & regulation watch',  sub: 'EU AI Act, NIST, global policy' },
];

export default function LoginPage() {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid email or password.');

      let targetUrl = '/';
      if (typeof window !== 'undefined') {
        const params       = new URLSearchParams(window.location.search);
        const redirectParam = params.get('redirect');
        if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
          targetUrl = redirectParam;
        }
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── LEFT PANEL: Product Identity ──────────────────────────────── */}
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

        {/* Hero headline */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>Surveillance Active — 24/7 Multi-Engine</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Stay ahead of every<br />
              <span className="text-primary">AI breakthrough.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Continuous intelligence across foundation models, frontier research, developer tooling, and regulation — synthesized into plain English before the public hears about it.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURE_BULLETS.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground">
                  <Icon size={13} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-none mb-0.5">{label}</p>
                  <p className="text-[11px] text-muted-foreground/70">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom attribution */}
        <div className="relative z-10 flex items-center gap-2 text-[11px] text-muted-foreground/50 font-mono">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Primary sources only · Zero hallucinations · No fabrication</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: Sign In Form ──────────────────────────────────── */}
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
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your intelligence account.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 p-3.5 text-sm text-red-400">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <span className="text-xs text-muted-foreground/50 cursor-not-allowed select-none">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-xs text-muted-foreground/50">Don&apos;t have an account?</span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          {/* Sign up CTA */}
          <Link
            href="/signup"
            className="flex w-full items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] py-3 text-sm font-medium text-foreground hover:bg-white/[0.06] hover:border-white/[0.15] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          >
            Sign Up
          </Link>

          {/* Legal */}
          <p className="mt-6 text-center text-[11px] text-muted-foreground/40 leading-relaxed">
            By signing in you agree to our{' '}
            <Link href="/terms" className="underline hover:text-muted-foreground transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-muted-foreground transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
