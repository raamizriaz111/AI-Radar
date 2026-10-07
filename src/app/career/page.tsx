import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  TrendingUp,
  BookOpen,
  Settings,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { CareerSignalCard } from '@/components/personalization/CareerSignalCard';
import { SkillGapCard } from '@/components/personalization/SkillGapCard';
import { LearningTopicCard } from '@/components/personalization/LearningTopicCard';
import {
  getUserProfile,
  getCareerSignals,
  getSkillGaps,
  getLearningTopicsCatalog,
} from '@/lib/repositories/personalizationRepository';
import { getItems } from '@/lib/repositories/itemRepository';
import { analyzeSkillDemand } from '@/lib/personalization/skillDemandEngine';

export const metadata: Metadata = {
  title: 'Career & Learning',
  description: 'See which skills are in demand and what AI developments mean for jobs and learning.',
};

export const dynamic = 'force-dynamic';

export default async function CareerPage() {
  const profile = await getUserProfile();
  const [signals, skillGaps, learningTopics, { data: items }] = await Promise.all([
    getCareerSignals(),
    getSkillGaps(profile),
    getLearningTopicsCatalog(),
    getItems({ pageSize: 60 }),
  ]);

  const skillDemand = analyzeSkillDemand(items, profile);

  return (
    <>
      <TopHeader
        title="Career & Learning"
        description="See what skills are in demand and how AI is changing jobs."
      />
      <PageContainer>
        {/* Profile Context Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-card/70 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Personalized for: {profile.name || 'AI Engineer'}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                  {profile.experienceLevel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Primary Focus: <strong className="text-foreground font-medium">{profile.primaryRoleInterest}</strong> · {profile.skills.length} tracked skills
              </p>
            </div>
          </div>

          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Settings size={13} />
            <span>Edit Skills & Goals</span>
          </Link>
        </div>

        {/* Cautious Guidance Alert */}
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
          <ShieldAlert size={16} className="mt-0.5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-medium text-foreground">Non-Prescriptive Principle: </span>
            Skill gaps and career signals are observed from recent research papers, open-source repositories, and developer tool releases. They represent optional opportunities for investigation and hands-on testing, never employment or salary guarantees.
          </div>
        </div>

        {/* Section 1: Potential Skill Gaps & Learning Pathways */}
        <div className="mb-8">
          <SectionHeader
            title="Potential Skill Gaps & Learning Pathways"
            description="High-frequency technologies and techniques observed in recent intelligence that are missing or early in your profile."
          />

          {skillGaps.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-muted-foreground">
              No skill gaps detected. Your profile aligns well with current observed intelligence patterns.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {skillGaps.map((gap) => (
                <SkillGapCard key={gap.id} skillGap={gap} />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Macro Career Signals & Shifts */}
        <div className="mb-8">
          <SectionHeader
            title="Evidence-Backed Career Signals"
            description="Observable shifts in architecture, emerging roles, and workflow patterns supported by primary source items."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {signals.map((signal) => (
              <CareerSignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        </div>

        {/* Section 3: Skill Demand Explorer */}
        <div className="mb-8">
          <SectionHeader
            title="Skill Demand Explorer"
            description="Frequency of technologies, runtimes, and concepts across all collected intelligence items."
          />

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {skillDemand.slice(0, 12).map((metric) => (
                <div
                  key={metric.name}
                  className="flex items-center justify-between rounded border border-border/70 bg-muted/20 p-2.5 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {metric.status === 'surging' && (
                        <Flame size={12} className="text-amber-400" />
                      )}
                      <span>{metric.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {metric.category} · {metric.uniqueSources} sources
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-semibold text-foreground">
                      {metric.frequency}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">mentions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Learning Topics & Curated Concept Maps */}
        <div>
          <SectionHeader
            title="Curated Learning Blueprints"
            description="Structured concept maps with prerequisites, key principles, and milestone project ideas."
            action={
              <Link
                href="/business"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Explore Projects to Build <ArrowRight size={12} />
              </Link>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {learningTopics.map((topic) => (
              <LearningTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
