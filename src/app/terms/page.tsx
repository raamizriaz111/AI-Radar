import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'Terms of Service · AI Radar',
  description: 'Terms and conditions governing the use of AI Radar intelligence services.',
};

export default function TermsPage() {
  const lastUpdated = 'October 6, 2026';

  return (
    <>
      <TopHeader
        title="Terms of Service"
        description="Legal terms and fair use policy for the AI Radar platform."
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Terms of Service
              </h1>
              <p className="text-xs text-muted-foreground">Effective Date: {lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">1. Agreement to Terms</h2>
            <p>
              By accessing or using AI Radar (&ldquo;the Service&rdquo;), operated at airadar.dev, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">2. Description of the Service</h2>
            <p>
              AI Radar is an automated intelligence monitoring platform designed to collect, index, analyze, and synthesize public developments across artificial intelligence, machine learning research, software tooling, and regulatory policy.
            </p>
            <p>
              The Service provides AI-assisted executive summaries, impact assessments, and emerging trend clusters. AI Radar does not create original news claims; all synthesized information is grounded in verifiable primary sources.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">3. Source Provenance & Intellectual Property</h2>
            <p>
              AI Radar respects intellectual property rights. Original articles, academic research papers, software repositories, and company announcements cited within AI Radar remain the intellectual property of their respective creators, publishers, and authors.
            </p>
            <p>
              AI Radar provides transformative, fair-use analysis and always displays direct canonical links to the original publisher. If you are a rights holder and believe your work is indexed improperly, contact us at legal@airadar.dev for prompt evaluation.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">4. Informational Purpose & No Professional Advice</h2>
            <p>
              All summaries, career projections, business signals, and regulatory overviews provided by AI Radar are for general informational and educational purposes only. They do not constitute formal legal, financial, architectural, or investment advice. You are responsible for conducting independent verification before taking business or technical action.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">5. Accounts, Security & Usage Limits</h2>
            <p>
              When you create an account, you agree to provide accurate credentials and maintain the confidentiality of your session. You are responsible for all activities that occur under your account.
            </p>
            <p>
              Each subscription tier is subject to reasonable quotas (such as daily briefing requests and AI synthesis requests). We reserve the right to throttle or terminate access for automated scraping, denial-of-service attempts, or reverse-engineering of private APIs.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">6. Billing, Subscriptions & Cancellations</h2>
            <p>
              Paid plans (Pro and Advanced) are billed on a recurring monthly or annual basis via Stripe. You may cancel your subscription at any time via the Account Billing portal. Upon cancellation, your subscription will remain active until the end of the current billing cycle.
            </p>
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">7. Modifications to the Service</h2>
            <p>
              We reserve the right to withdraw or amend our Service, and any feature or material we provide, at our sole discretion without prior notice. We will not be liable if for any reason all or any part of the Service is unavailable at any time.
            </p>
          </section>

          <div className="pt-4 text-center">
            <p className="text-[11px] text-muted-foreground/60">
              Questions regarding these Terms? Contact{' '}
              <a href="mailto:support@airadar.dev" className="text-primary hover:underline">
                support@airadar.dev
              </a>
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
