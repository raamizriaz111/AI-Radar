import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { getAllPlans } from '@/lib/billing/planConfig';
import { PricingTableClient } from '@/components/billing/PricingTableClient';

export const metadata: Metadata = { title: 'Pricing' };

export default function PricingPage() {
  const plans = getAllPlans();

  return (
    <>
      <TopHeader
        title="Pricing"
        description="Choose the plan that fits your intelligence needs."
      />
      <PageContainer>
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-3">Simple, Transparent Pricing</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
            Start for free. Upgrade when you need more intelligence. All plans include full access to AI Radar&apos;s core intelligence engine.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs text-primary font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Autonomous Intelligence Delivery:</span>
            <span className="text-foreground/90">Email alerts, daily 7:00 AM briefs, and real-time triggers</span>
          </div>
        </div>

        <PricingTableClient plans={plans} />



        {/* Why Autonomous Push Section */}
        <div className="mb-6 rounded-xl border border-white/[0.08] bg-card p-5">
          <SectionHeader
            title="Why an Individual Push Subscription?"
            description="The key difference between Free and Paid is autonomous delivery."
          />
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground pt-1">
            <div className="rounded-lg bg-secondary/30 p-3.5 border border-white/[0.04] space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <span>Free Plan: Manual Pull</span>
              </span>
              <p className="leading-relaxed">
                Great if you enjoy visiting the dashboard manually every day to read research and news. You retain full access to our primary intelligence collectors.
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/[0.06] p-3.5 border border-blue-500/20 space-y-1.5">
              <span className="font-bold text-blue-300 text-sm flex items-center gap-1.5">
                <span>Pro & Advanced: Autonomous Push</span>
              </span>
              <p className="leading-relaxed text-blue-200/80">
                AI Radar works while you sleep. At 7:00 AM, a distilled 3-minute executive brief is waiting in your inbox. When breakthrough foundation models drop, you receive immediate notifications before news breaks on social media.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <SectionHeader
            title="All Plans Include"
            description="Core intelligence features are available on every plan."
          />
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
              {[
                'Full AI intelligence pipeline',
                'arXiv, GitHub & Hacker News sources',
                'AI-powered daily briefings',
                'Emerging trend detection',
                'Personal profile & skill matching',
                'Project opportunity suggestions',
                'Career signal detection',
                'Bookmark & save intelligence',
                'Personalized relevance scoring',
                'Row Level Security (data isolation)',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check size={11} className="text-emerald-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Questions about your account or plan?{' '}
            <Link href="/settings" className="text-primary hover:underline">
              Visit Settings
            </Link>{' '}
            or reach out to support.
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1 font-mono">
            All prices in USD · 256-bit SSL encrypted · Cancel anytime in 1 click
          </p>
        </div>
      </PageContainer>
    </>
  );
}
