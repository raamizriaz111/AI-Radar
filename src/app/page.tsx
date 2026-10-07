import type { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Radar,
  Newspaper,
  Wrench,
  FlaskConical,
  Bot,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Shield,
  Bookmark,
  Zap,
  ArrowRight,
  Sparkles,
  Calendar,
  Flame,
  Radio,
  Clock,
  Compass,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { EmptyState } from '@/components/intelligence/EmptyState';
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard';
import { LivePulseBar } from '@/components/intelligence/LivePulseBar';
import { HorizonRadar } from '@/components/intelligence/HorizonRadar';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { getItems } from '@/lib/repositories/itemRepository';
import { getLatestBriefing } from '@/lib/repositories/briefingRepository';
import { getAllTrends } from '@/lib/repositories/trendRepository';
import { getUpcomingHorizonEvents } from '@/lib/intelligence/horizonService';
import { TrendStatusBadge } from '@/components/intelligence/TrendBadge';
import { mapItemToCardItem } from '@/lib/utils';
import { getUserProfile } from '@/lib/repositories/personalizationRepository';
import { getCurrentUser } from '@/lib/auth/session';
import { computePersonalRelevance } from '@/lib/personalization/personalRelevance';
import { PersonalRelevanceBadge } from '@/components/personalization/PersonalRelevanceBadge';
import { HeroWelcomeBanner } from '@/components/home/HeroWelcomeBanner';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';

import { ExecutiveBriefingSpotlight } from '@/components/intelligence/ExecutiveBriefingSpotlight';

export const metadata: Metadata = {
  title: 'AI Radar — Real-Time AI Intelligence & Horizon',
  description: 'Live real-time news, verified developments, and forward-looking AI horizon radar.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Query live diagnostics, items, briefing, trends, and upcoming horizon events concurrently
  const [report, recentItemsRes, latestBriefing, initialTopTrends, profile, horizonEvents] = await Promise.all([
    getDiagnosticsReport(),
    getItems({ pageSize: 12 }),
    getLatestBriefing(),
    getAllTrends({ limit: 4 }),
    getUserProfile(user?.id),
    getUpcomingHorizonEvents(),
  ]);

  let topTrends = initialTopTrends;
  if (topTrends.length === 0 && recentItemsRes.data.length > 0) {
    try {
      const { discoverTrends } = await import('@/lib/intelligence/trendDiscovery');
      const { saveTrendsBatch } = await import('@/lib/repositories/trendRepository');
      const discovered = await discoverTrends(recentItemsRes.data);
      if (discovered.length > 0) {
        await saveTrendsBatch(discovered);
        topTrends = await getAllTrends({ limit: 4 });
      }
    } catch {
      // safe fallback
    }
  }

  const items = recentItemsRes.data;
  const leadStory = items[0] ?? null;
  const secondaryStories = items.slice(1);

  // Compute personalized items if any match user interests
  const itemsWithRelevance = items.map((item) => ({
    item,
    relevance: computePersonalRelevance(item, profile),
  }));

  const personallyRelevantItems = itemsWithRelevance
    .filter(({ relevance }) => !relevance.isExcluded && relevance.score >= 40)
    .sort((a, b) => b.relevance.score - a.relevance.score)
    .slice(0, 2);

  return (
    <>
      <TopHeader
        title="Live Intelligence"
        description="Real-time global AI developments, plain-English executive analysis, and horizon tracking."
      />

      <PageContainer className="space-y-6">
        {/* Hero Welcome Experience for Public & First-Time Readers */}
        <HeroWelcomeBanner isAuthenticated={Boolean(user)} />

        {/* Live Pulse Bar */}
        <LivePulseBar
          totalItems={report.counts.items || items.length}
          sourcesCount={report.counts.activeSources || 4}
        />

        {/* Lead / Breaking Story of the Hour */}
        {leadStory && (
          <section aria-labelledby="featured-story-heading">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 id="featured-story-heading" className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                  Lead Story · Live Verified
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground/60">
                Top Signal Today
              </span>
            </div>

            <IntelligenceCard
              item={mapItemToCardItem(leadStory)}
              featured={true}
            />
          </section>
        )}

        {/* Elevated 5-Minute Executive Briefing Spotlight */}
        {latestBriefing && (
          <ExecutiveBriefingSpotlight briefing={latestBriefing} />
        )}

        {/* Personalized Intelligence Feed (if relevant) */}
        {personallyRelevantItems.length > 0 && (
          <section className="rounded-xl border border-primary/25 bg-primary/[0.03] p-5 backdrop-blur-sm">
            <SectionHeader
              title={`Handpicked For You · ${profile.primaryRoleInterest || 'Curious Explorer'}`}
              description="Developments selected based on your focus areas, interests, and stated goals."
              action={
                <Link
                  href="/career"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View Career & Skills <ArrowRight size={11} aria-hidden="true" />
                </Link>
              }
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              {personallyRelevantItems.map(({ item, relevance }) => (
                <div key={item.id} className="relative">
                  <div className="absolute right-3 top-3 z-10">
                    <PersonalRelevanceBadge
                      score={relevance.score}
                      reasons={relevance.reasons}
                    />
                  </div>
                  <IntelligenceCard item={mapItemToCardItem(item)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main 2-Column Command Center */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (8 cols): Interactive Stream with Density Switcher */}
          <div className="space-y-6 lg:col-span-8">
            <IntelligenceStreamView
              initialItems={secondaryStories.map(mapItemToCardItem)}
              totalCount={report.counts.items || items.length}
            />

            {/* Quick Desks Grid */}
            <div className="pt-2">
              <SectionHeader
                title="Explore Intelligence Desks"
                description="Specialized sections categorized for instant investigation."
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'New AI Tools', href: '/tools', icon: Wrench, desc: 'Apps you can use' },
                  { label: 'AI Code Agents', href: '/coding-agents', icon: Bot, desc: 'Developer helpers' },
                  { label: 'Safety & Rules', href: '/safety', icon: Shield, desc: 'Global laws & policy' },
                  { label: 'New Systems', href: '/research', icon: FlaskConical, desc: 'Models & papers' },
                ].map((desk) => {
                  const Icon = desk.icon;
                  return (
                    <Link
                      key={desk.href}
                      href={desk.href}
                      className="group flex flex-col justify-between rounded-xl border border-white/[0.07] bg-card/60 p-3.5 transition-all hover:border-white/20 hover:bg-card hover:shadow-md"
                    >
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {desk.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{desk.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Horizon Radar, Daily Briefing, Trending Signals */}
          <div className="space-y-6 lg:col-span-4">
            {/* Upcoming Horizon Radar */}
            <div className="rounded-xl border border-white/[0.08] bg-card/70 p-5 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
                    <Sparkles size={13} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight text-foreground uppercase font-mono">
                      Upcoming Horizon
                    </h3>
                    <p className="text-[10px] text-muted-foreground">What to expect next in AI</p>
                  </div>
                </div>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-amber-400">
                  {horizonEvents.length} TRACKED
                </span>
              </div>

              <HorizonRadar events={horizonEvents.slice(0, 3)} compact={true} />
            </div>

            {/* Autonomous Push Alerts Value Card */}
            <div className="rounded-xl border border-white/[0.08] bg-card/70 p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Radio size={13} className="text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-foreground">
                      Push Delivery Network
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Autonomous morning dispatch</p>
                  </div>
                </div>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-primary">
                  PRO · ADVANCED
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive today&apos;s synthesized briefing and breaking model announcements delivered directly to your inbox at 7:00 AM daily.
              </p>

              <Link
                href="/pricing"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-2 text-xs font-semibold text-primary transition-colors shadow-sm"
              >
                <span>View Alert Plans ($10 / $20)</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Trending Topics & Momentum */}
            <div className="rounded-xl border border-white/[0.08] bg-card/70 p-5 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
                    <TrendingUp size={13} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-foreground">
                      Topics Gaining Heat
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Velocity & corroborated signals</p>
                  </div>
                </div>
                <Link href="/trends" className="text-[11px] text-primary hover:underline font-medium">
                  See all
                </Link>
              </div>

              {topTrends.length > 0 ? (
                <div className="space-y-2.5">
                  {topTrends.map((trend) => {
                    const trendSlug = trend.slug || trend.id;
                    return (
                      <Link
                        key={trend.id}
                        href={`/trends/${trendSlug}`}
                        className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-secondary/60"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {trend.title}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {trend.distinct_source_count ?? trend.item_count} corroborating sources
                          </p>
                        </div>
                        <TrendStatusBadge status={trend.status} />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2.5 text-center text-xs text-muted-foreground">
                  <p>Synthesizing emerging topics from recent intelligence...</p>
                  <Link href="/trends" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                    <span>Explore Emerging Trends</span>
                    <ArrowRight size={10} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
