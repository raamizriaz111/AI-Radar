'use client';

// =============================================================================
// AI Radar — Account Registration Page
// =============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radar, Mail, Lock, User, Eye, EyeOff, AlertCircle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Hard redirect to Onboarding with newly established session cookies
      window.location.href = '/onboarding';
    } catch (err: any) {
      setError(err?.message || 'Error creating account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 selection:bg-primary/20 selection:text-primary">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[128px]" />
        <div className="absolute left-2/3 top-2/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Back Link to Sign In */}
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={13} />
            <span>Back to Sign In</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/20">
            <Radar size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Create Your Account</h1>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xs">
            Start tracking primary AI intelligence feeds, foundation model breakthroughs, and signals.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 animate-in fade-in duration-200">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Your Name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Alex Chen"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="developer@example.com"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/[0.1] bg-black/40 py-2.5 pl-9 pr-10 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || password.length < 6}
            className="w-full min-h-[42px] rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Creating account…</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Sign In Prompt */}
        <div className="mt-6 border-t border-white/[0.08] pt-5 text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/90 font-bold hover:underline transition-colors ml-1"
            >
              Sign in →
            </Link>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            By creating an account, you agree to the{' '}
            <Link href="/terms" className="hover:text-foreground underline">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
