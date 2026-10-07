import type { Metadata } from 'next';
import { ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { TopicPreferencesEditor } from '@/components/intelligence/TopicPreferencesEditor';
import { ProfileEditor } from '@/components/personalization/ProfileEditor';
import { AccountSettingsManager } from '@/components/personalization/AccountSettingsManager';
import { EmailAlertSettings } from '@/components/personalization/EmailAlertSettings';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <>
      <TopHeader
        title="Settings"
        description="Manage your personal profile, topic preferences, and automated dispatches."
      />
      <PageContainer>
        {/* Subscription & Billing */}
        <div className="mb-6">
          <SectionHeader
            title="Subscription & Billing Plans"
            description="Manage your active plan, usage allowances, and billing history."
            action={
              <Link
                href="/account/billing"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Open Billing <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                <span className="text-xs font-medium text-foreground">Subscription Plans</span>
              </div>
              <Link
                href="/pricing"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View pricing <ArrowRight size={10} />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Free, Pro ($10/mo), and Advanced ($20/mo) individual plans available. All plans include the full AI intelligence pipeline.
              Upgrade or manage your subscription at any time.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/pricing"
                className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                View Plans
              </Link>
              <Link
                href="/account/billing"
                className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Billing & Usage
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <SectionHeader
            title="Account Allowances & Tracked Topics"
            description="Manage your multi-user plan allowances, actively tracked topics, and privacy controls."
          />
          <AccountSettingsManager />
        </div>

        <div className="mb-8">
          <SectionHeader
            title="Morning Digest & Push Alerts"
            description="Configure your 7:00 AM daily briefing delivery, breaking model alerts, and keyword triggers."
            action={
              <Link
                href="/account/billing#email-alerts"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Manage in Billing & Alerts <ArrowRight size={12} />
              </Link>
            }
          />
          <EmailAlertSettings />
        </div>

        <div className="mb-8">
          <SectionHeader
            title="Personal AI Profile & Career Focus"
            description="Configure your skills, target roles, active tech stack, and learning priorities for personalized intelligence and project recommendations."
          />
          <ProfileEditor />
        </div>

        <div className="mb-6">
          <SectionHeader
            title="Topic & Source Priorities"
            description="Control which topics and trends are prioritized in your Daily Briefing."
          />
          <TopicPreferencesEditor />
        </div>

        <div>
          <SectionHeader
            title="Security & Storage"
            description="Row Level Security and data privacy configuration."
          />
          <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Row Level Security (RLS) Active</span>
            </div>
            <p>
              Private user data (such as bookmarks and profiles) is protected with strict RLS policies in migration 002. Only authenticated owners can read and mutate their own saved records.
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
