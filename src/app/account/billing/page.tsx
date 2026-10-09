'use client';

// =============================================================================
// AI Radar — Account Billing Redirect
// =============================================================================
// All pricing, plan tier upgrades, and checkout are now unified on /pricing
// with in-page CheckoutModal. Any legacy requests to /account/billing are
// immediately routed to /pricing with full query parameter preservation.
// =============================================================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AccountBillingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      router.replace(`/pricing${search}`);
    }
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">Opening Pricing &amp; Plans…</p>
        <p className="text-xs text-muted-foreground">Unified in-page plan management</p>
      </div>
    </div>
  );
}
