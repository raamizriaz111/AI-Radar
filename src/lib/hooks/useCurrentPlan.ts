'use client';

// =============================================================================
// AI Radar — Universal Client Plan & Feature Access Hook
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { PlanSlug } from '@/lib/billing/planConfig';

export interface PlanState {
  planSlug: PlanSlug;
  displayName: string;
  priceMonthlyUsd: number;
  isFree: boolean;
  isPro: boolean;
  isAdvanced: boolean;
  canAccessBlueprints: boolean;
  canAccessApi: boolean;
  canExport: boolean;
  canAccessWebhooks: boolean;
  aiRequestsLimit: number;
  trackedTopicsLimit: number;
  loading: boolean;
  switchPlan: (tier: PlanSlug) => Promise<boolean>;
}

const PLAN_STORAGE_KEY = 'ai_radar_active_plan_tier';
const PLAN_EVENT_NAME = 'ai_radar_plan_updated';

export function useCurrentPlan(): PlanState {
  const [planSlug, setPlanSlug] = useState<PlanSlug>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PLAN_STORAGE_KEY);
      if (stored === 'free' || stored === 'pro' || stored === 'advanced') {
        return stored as PlanSlug;
      }
    }
    return 'free';
  });

  const [loading, setLoading] = useState(true);

  // Sync with server subscription API
  const refreshPlanFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      if (res.ok) {
        const data = await res.json();
        const serverSlug = data.subscription?.planSlug || data.plan?.slug || 'free';
        if (serverSlug === 'free' || serverSlug === 'pro' || serverSlug === 'advanced') {
          setPlanSlug(serverSlug);
          if (typeof window !== 'undefined') {
            localStorage.setItem(PLAN_STORAGE_KEY, serverSlug);
          }
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlanFromServer();

    // Listen to cross-component plan update events
    const handlePlanEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ planSlug: PlanSlug }>;
      if (customEvent.detail?.planSlug) {
        setPlanSlug(customEvent.detail.planSlug);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(PLAN_EVENT_NAME, handlePlanEvent);
      return () => {
        window.removeEventListener(PLAN_EVENT_NAME, handlePlanEvent);
      };
    }
  }, [refreshPlanFromServer]);

  const switchPlan = useCallback(async (newSlug: PlanSlug): Promise<boolean> => {
    try {
      setPlanSlug(newSlug);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLAN_STORAGE_KEY, newSlug);
        window.dispatchEvent(
          new CustomEvent(PLAN_EVENT_NAME, { detail: { planSlug: newSlug } })
        );
      }

      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: newSlug, billingInterval: 'monthly' }),
      });

      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const isFree = planSlug === 'free';
  const isPro = planSlug === 'pro';
  const isAdvanced = planSlug === 'advanced';

  return {
    planSlug,
    displayName: isAdvanced ? 'Advanced' : isPro ? 'Pro' : 'Free',
    priceMonthlyUsd: isAdvanced ? 20 : isPro ? 10 : 0,
    isFree,
    isPro,
    isAdvanced,
    canAccessBlueprints: isPro || isAdvanced,
    canAccessApi: isAdvanced,
    canExport: isPro || isAdvanced,
    canAccessWebhooks: isAdvanced,
    aiRequestsLimit: isAdvanced ? 10000 : isPro ? 1000 : 100,
    trackedTopicsLimit: isAdvanced ? 500 : isPro ? 100 : 20,
    loading,
    switchPlan,
  };
}
