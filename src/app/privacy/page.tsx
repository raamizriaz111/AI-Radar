import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'Privacy Policy · AI Radar',
  description: 'How AI Radar collects, protects, and respects your personal data.',
};

export default function PrivacyPage() {
  const lastUpdated = 'October 6, 2026';

  return (
    <>
      <TopHeader
        title="Privacy Policy"
        description="Our commitment to your privacy, data security, and confidentiality."
      />
      <PageContainer narrow className="py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={13} />
            <span>Back to Intelligence Stream</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Privacy Policy
              </h1>
              <p className="text-xs text-muted-foreground">Last Revised: {lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">1. Our Core Privacy Philosophy</h2>
            <p>
              At AI Radar, we believe your reading habits, research focus areas, and skill interests belong to you. We do not sell your personal data to data brokers, we do not monetize your attention via third-party advertising networks, and we never train public machine learning models on your private personal inputs.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">2. Information We Collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-foreground">Account Information:</strong> When you register, we collect your email address and optional display name to authenticate your session and manage your subscription.
              </li>
              <li>
                <strong className="text-foreground">Personalization Preferences:</strong> Role interests (e.g. AI Engineer, Researcher), bookmarked intelligence items, and custom topic filters you configure.
              </li>
              <li>
                <strong className="text-foreground">Technical Usage Data:</strong> Anonymized HTTP request logs, diagnostic latency, and rate-limit counters necessary to maintain platform uptime and prevent denial-of-service attacks.
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">3. How We Use Your Data</h2>
            <p>
              Your data is used solely to:
            </p>
            <ul className="space-y-1.5 list-disc list-inside pl-2">
              <li>Deliver your personalized daily intelligence briefings and radar alerts.</li>
              <li>Maintain your saved articles and private bookmarks.</li>
              <li>Process payments and manage plan quotas via our payment partner (Stripe).</li>
              <li>Ensure the security and reliability of our global infrastructure.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">4. Storage, Encryption & Security</h2>
            <p>
              All user records are isolated using multi-tenant security architecture and encrypted at rest and in transit (TLS 1.3). Authentication sessions are secured using HTTP-only secure cookies with Strict SameSite policies.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">5. Your Rights: Export & Permanent Deletion</h2>
            <p>
              Under global privacy frameworks (including GDPR and CCPA), you retain full sovereignty over your data:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-foreground">Right to Access:</strong> You can view all tracked topics, profile data, and billing history at any time in your Settings and Account dashboards.
              </li>
              <li>
                <strong className="text-foreground">Right to Erasure (1-Click Deletion):</strong> You may permanently delete your account and all associated personal records at any time via Settings. All bookmarks, profiles, usage metrics, and sessions are immediately purged from our database.
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">6. Third-Party Service Providers</h2>
            <p>
              We partner with trusted enterprise infrastructure providers strictly for core platform functionality:
            </p>
            <ul className="space-y-1 list-disc list-inside pl-2">
              <li><strong>Supabase:</strong> Encrypted PostgreSQL database and authentication.</li>
              <li><strong>Stripe:</strong> PCI-compliant billing and invoice processing.</li>
              <li><strong>Vercel / Cloudflare:</strong> Edge routing and content delivery.</li>
            </ul>
          </section>

          <div className="pt-4 text-center">
            <p className="text-[11px] text-muted-foreground/60">
              For privacy inquiries or data requests, contact{' '}
              <a href="mailto:privacy@airadar.dev" className="text-primary hover:underline">
                privacy@airadar.dev
              </a>
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
