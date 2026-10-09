'use client';

// =============================================================================
// AI Radar — Application Layout Shell
// =============================================================================
// Selectively wraps internal authenticated dashboard routes with the
// executive Sidebar and Mobile Navigation bar, while providing a clean,
// focused, distraction-free full-screen environment for auth and public pages
// (/login, /signup, /terms, /privacy).
// =============================================================================

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

const STANDALONE_ROUTES = ['/login', '/signup', '/terms', '/privacy'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isStandalone = STANDALONE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar + drawer (hidden on desktop) */}
        <MobileNav />

        {/* Page content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
