'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  LayoutDashboard,
  Newspaper,
  Wrench,
  FlaskConical,
  Bot,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Shield,
  Bookmark,
  Zap,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { SearchModal } from '@/components/intelligence/SearchModal';
import { useCurrentPlan } from '@/lib/hooks/useCurrentPlan';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Live Intelligence', href: '/', icon: <LayoutDashboard size={16} /> },
  { label: "Today's Briefing", href: '/briefing', icon: <Zap size={16} /> },
  { label: "What's Growing", href: '/trends', icon: <TrendingUp size={16} /> },
  { label: 'AI News Stream', href: '/news', icon: <Newspaper size={16} /> },
  { label: 'New AI Tools', href: '/tools', icon: <Wrench size={16} /> },
  { label: 'New AI Systems', href: '/research', icon: <FlaskConical size={16} /> },
  { label: 'AI Code Agents', href: '/coding-agents', icon: <Bot size={16} /> },
  { label: 'Safety & Rules', href: '/safety', icon: <Shield size={16} /> },
  { label: 'Saved Stories', href: '/bookmarks', icon: <Bookmark size={16} /> },
  { label: 'Career & Learning', href: '/career', icon: <GraduationCap size={16} /> },
  { label: 'Business Signals', href: '/business', icon: <Briefcase size={16} /> },
  { label: 'Pricing & Plans', href: '/pricing', icon: <CreditCard size={16} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isFree, isPro, isAdvanced, displayName } = useCurrentPlan();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    name?: string;
    role?: string;
  } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar: fixed 56px height (h-14) */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.08] bg-card/90 backdrop-blur-xl px-4 lg:hidden sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            <span className="text-sm font-bold tracking-tight text-foreground block leading-none">AI Radar</span>
            <span className="text-[10px] font-mono text-muted-foreground/70 tracking-wider">LIVE INTEL</span>
          </div>
        </Link>

        {/* Right side mobile actions: Tier Indicator + Search trigger + Menu toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Active Tier Badge */}
          <Link
            href="/account/billing"
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold font-mono transition-colors',
              isAdvanced
                ? 'border border-purple-500/40 bg-purple-500/15 text-purple-300'
                : isPro
                ? 'border border-blue-500/30 bg-blue-500/15 text-blue-300'
                : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            )}
            title={`Active Tier: ${displayName} · Click to manage plan`}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isAdvanced
                  ? 'bg-purple-400 animate-pulse'
                  : isPro
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-emerald-500'
              )}
            />
            <span>{isAdvanced ? 'ADVANCED' : isPro ? 'PRO' : 'FREE'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Search intelligence"
          >
            <Search size={17} />
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="mobile-nav-menu"
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Global Search Modal for Mobile */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Slide-in drawer with precise 56px (top-14) offset */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <nav
            id="mobile-nav-menu"
            className="fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-72 overflow-y-auto border-r border-white/[0.08] bg-card p-3.5 shadow-2xl lg:hidden flex flex-col justify-between"
            aria-label="Mobile navigation"
          >
            <div className="space-y-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors mb-0.5',
                    isActive(item.href)
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Bottom session & footer */}
            <div className="mt-4 pt-3 pb-6 border-t border-white/[0.08] space-y-2.5">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-secondary/50 p-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        {currentUser.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="truncate font-semibold text-foreground">{currentUser.name || 'Account'}</p>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase',
                            isAdvanced
                              ? 'bg-purple-500/20 text-purple-300'
                              : isPro
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/15 text-emerald-400'
                          )}
                        >
                          {displayName} Plan
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Sign out"
                      aria-label="Sign out"
                      className="rounded-md p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex min-h-[40px] items-center justify-center rounded-lg border border-white/[0.1] py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="flex min-h-[40px] items-center justify-center rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              )}

              {/* Legal & Status Links */}
              <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-muted-foreground/70 font-mono">
                <Link href="/privacy" onClick={() => setOpen(false)} className="hover:text-foreground">
                  Privacy
                </Link>
                <span>·</span>
                <Link href="/terms" onClick={() => setOpen(false)} className="hover:text-foreground">
                  Terms
                </Link>
                <span>·</span>
                <Link href="/pricing" onClick={() => setOpen(false)} className="hover:text-primary">
                  $10 Pro
                </Link>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
