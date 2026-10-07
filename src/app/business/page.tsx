import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Settings, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { ProjectOpportunityCatalog } from '@/components/personalization/ProjectOpportunityCatalog';
import {
  getUserProfile,
  getProjectOpportunities,
} from '@/lib/repositories/personalizationRepository';

export const metadata: Metadata = {
  title: 'What Could I Build? — Project Opportunities',
  description: 'Evidence-backed developer problems and practical AI projects matched to your skills.',
};

export const dynamic = 'force-dynamic';

export default async function BusinessPage() {
  const profile = await getUserProfile();
  const opportunities = await getProjectOpportunities(profile);

  return (
    <>
      <TopHeader
        title="What Could I Build? — Project Opportunities"
        description="Practical, evidence-backed projects and tools derived from real ecosystem developments and developer problems."
      />
      <PageContainer>
        {/* Header Profile Context */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-card/70 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Skill-Matched Project Discovery
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {opportunities.length} Actionable Ideas
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Matched against your active tech stack: {profile.technologies.slice(0, 5).join(', ')}...
              </p>
            </div>
          </div>

          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Settings size={13} />
            <span>Update Profile Stack</span>
          </Link>
        </div>

        {/* Validation & Caution Note */}
        <div className="mb-6 rounded-lg border border-border bg-card/60 p-4 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <ShieldAlert size={14} className="text-primary" />
            <span>Project Validation Philosophy</span>
          </div>
          <p className="leading-relaxed">
            Every opportunity here is an <strong>exploratory hypothesis</strong> formulated around real developer friction observed across research papers, model releases, and open-source discussions.
          </p>
          <p className="leading-relaxed">
            Build small weekend prototypes first to test feasibility and validate user demand before investing significant time. No project is claimed to be an instant commercial business without validation.
          </p>
        </div>

        {/* Interactive Catalog */}
        <div className="mb-6">
          <SectionHeader
            title="Actionable Project Opportunities"
            description="Concrete tools, protocols, and evaluation harnesses you can build to level up your engineering capabilities."
          />

          <ProjectOpportunityCatalog
            initialOpportunities={opportunities}
            profile={profile}
          />
        </div>
      </PageContainer>
    </>
  );
}
