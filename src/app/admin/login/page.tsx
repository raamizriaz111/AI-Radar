'use client';

// =============================================================================
// AI Radar — High-Security Admin Portal Login
// =============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, ArrowRight, AlertCircle, Radar, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!passkey.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        window.location.href = '/admin';
      } else {
        setError(data.error || 'Authentication failed. Access denied.');
        setLoading(false);
      }
    } catch {
      setError('Network communication failure with authentication server.');
      setLoading(false);
    }
  }

  function handleAutoFill() {
    setPasskey('radar_admin_2026');
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090B0F] px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-violet-500/30 border border-primary/40 text-primary shadow-xl shadow-primary/20 mb-4">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            AI RADAR ADMIN TERMINAL
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            Privileged telemetry access & real-time percentage analytics
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#141820]/90 backdrop-blur-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="passkey"
                className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2"
              >
                Admin Passkey / Master Secret
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="passkey"
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter administrator passkey"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-black/40 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-colors"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground/60">
                  Default passkey: <code className="text-primary font-bold">radar_admin_2026</code>
                </span>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-primary hover:underline hover:text-primary/90 font-bold transition-colors"
                >
                  Auto-fill Passkey
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 font-mono"
            >
              <span>{loading ? 'Authenticating Security Token…' : 'Authenticate & Open Dashboard'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <span className="text-[11px] text-muted-foreground">
              Need to return to public radar?{' '}
              <Link href="/" className="text-primary hover:underline font-semibold">
                Intelligence Home
              </Link>
            </span>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-muted-foreground/40 font-mono">
          SECURE PROTOCOL • MULTI-SOURCE NORMALIZED 100% TELEMETRY
        </div>
      </div>
    </div>
  );
}
