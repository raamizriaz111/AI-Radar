'use client';

// =============================================================================
// AI Radar — Senior Executive Primary Navigation Sidebar
// =============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Settings,
  Activity,
  Zap,
  LogIn,
  LogOut,
  CreditCard,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group?: 'Desks' | 'Workspace';
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  // Primary Feeds
  { label: 'Live Intelligence', href: '/', icon: <LayoutDashboard size={15} /> },
  {
    label: "Today's Briefing",
    href: '/briefing',
    icon: <Zap size={15} />,
    badge: 'Daily',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
  },
  { label: "What's Growing", href: '/trends', icon: <TrendingUp size={15} /> },

  // Specialized Desks
  {
    label: 'AI News Stream',
    href: '/news',
    icon: <Newspaper size={15} />,
    group: 'Desks',
    badge: 'Live',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  { label: 'New AI Tools', href: '/tools', icon: <Wrench size={15} />, group: 'Desks' },
  { label: 'New AI Systems', href: '/research', icon: <FlaskConical size={15} />, group: 'Desks' },
  { label: 'AI Code Agents', href: '/coding-agents', icon: <Bot size={15} />, group: 'Desks' },
  { label: 'Safety & Regulation', href: '/safety', icon: <Shield size={15} />, group: 'Desks' },

  // Workspace
  { label: 'Saved Stories', href: '/bookmarks', icon: <Bookmark size={15} />, group: 'Workspace' },
  { label: 'Career & Learning', href: '/career', icon: <GraduationCap size={15} />, group: 'Workspace' },
  { label: 'Business Signals', href: '/business', icon: <Briefcase size={15} />, group: 'Workspace' },
  {
    label: 'Pricing & Plans',
    href: '/pricing',
    icon: <CreditCard size={15} />,
    group: 'Workspace',
    badge: 'Pro $10',
    badgeColor: 'bg-primary/10 text-primary border-primary/30',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={15} />,
    group: 'Workspace',
  },
];

const GROUPS = ['Desks', 'Workspace'] as const;

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
        active
          ? 'bg-primary/15 text-primary shadow-sm font-semibold'
          : 'text-muted-foreground/80 hover:bg-white/[0.04] hover:text-foreground'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            'flex-shrink-0 transition-colors',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        >
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </div>

      {item.badge && (
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            item.badgeColor || 'bg-secondary text-muted-foreground border-white/[0.06]'
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    name?: string;
    role?: string;
  } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.plan?.planTier) {
            setCurrentPlan(data.plan.planTier);
          }
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

  const primaryItems = navItems.filter((i) => !i.group);

  return (
    <aside className="flex h-full w-[235px] flex-col border-r border-white/[0.07] bg-card/80 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
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
            <span className="text-sm font-bold tracking-tight text-foreground block leading-none">
              AI Radar
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/60 tracking-wider">
              REAL-TIME INTEL
            </span>
          </div>
        </Link>

        {/* Global Live Ticker Status */}
        <Link
          href="/diagnostics"
          title="All collection engines operational"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </Link>
      </div>

      {/* Navigation Feed Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5" aria-label="Primary navigation">
        {/* Core Live Stream & Briefing */}
        <div className="space-y-0.5">
          {primaryItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        {/* Grouped Intelligence Desks & Personal Workspace */}
        {GROUPS.map((group) => {
          const items = navItems.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="pt-4">
              <p className="px-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href)} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Session & Status Footer */}
      <div className="border-t border-white/[0.07] bg-card/50 p-3 space-y-2.5">
        {currentUser ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-secondary/40 p-2">
              <Link
                href="/settings"
                className="flex min-w-0 items-center gap-2 hover:opacity-85 transition-opacity"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
                  {currentUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {currentUser.name || 'Account'}
                    </p>
                    <span className="rounded bg-primary/15 px-1 py-0.2 text-[8px] font-mono font-bold uppercase text-primary">
                      {currentPlan}
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground/70 font-mono">
                    {currentUser.email || 'Active'}
                  </p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="rounded p-1 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-secondary/40 p-2 text-xs">
              <Link
                href="/login"
                className="flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}

        {/* Public Trust & Operational Badges */}
        <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between px-1 text-[11px] text-muted-foreground/70 font-mono">
          {currentUser?.role === 'admin' ? (
            <Link
              href="/diagnostics"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              title="System Diagnostics & Engine Latency"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Diagnostics</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium" title="All collection engines operational">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operational</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
