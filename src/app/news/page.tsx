import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard';
import { LivePulseBar } from '@/components/intelligence/LivePulseBar';
import { getItems } from '@/lib/repositories/itemRepository';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { mapItemToCardItem } from '@/lib/utils';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';

export const metadata: Metadata = {
  title: 'Real-Time Global AI News — Live Radar',
  description: 'Continuous live stream of verified AI breakthroughs, frontier models, and tech developments.',
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const [report, res] = await Promise.all([
    getDiagnosticsReport(),
    getItems({ categorySlug: 'ai-news', pageSize: 30 }),
  ]);
  const items = res.data;
  const leadStory = items[0] ?? null;
  const secondaryStories = items.slice(1);

  return (
    <>
      <TopHeader
        title="Real-Time AI News"
        description="Continuous verified coverage from global tech publishers, research labs, and frontier releases."
      />
      <PageContainer>
        {/* Real-Time Live Status Bar */}
        <div className="mb-6">
          <LivePulseBar
            totalItems={report.counts.items || items.length}
            sourcesCount={report.counts.activeSources || 4}
          />
        </div>

        {/* Breaking / Featured Lead Story Spotlight */}
        {leadStory && (
          <section aria-labelledby="featured-news-heading" className="mb-8">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 id="featured-news-heading" className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                  Breaking Headline · Live Verified
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground/60">
                Most Recent Development
              </span>
            </div>

            <IntelligenceCard
              item={mapItemToCardItem(leadStory)}
              featured={true}
            />
          </section>
        )}

        {/* Adaptive Stream Section with Compact Scan vs Deep Dive */}
        <IntelligenceStreamView
          initialItems={secondaryStories.map(mapItemToCardItem)}
          totalCount={items.length}
          title="Verified AI News Stream"
          description="Continuous live stream of AI industry releases, model updates, and regulatory movements."
          showCategoryFilter={false}
          showFullStreamLink={false}
          emptyIconName="newspaper"
          emptyTitle="No news stories in stream."
          emptyDescription="The live radar stream is currently refreshing. Verified announcements, frontier releases, and tech breakthroughs will appear as new cycles complete."
        />
      </PageContainer>
    </>
  );
}
