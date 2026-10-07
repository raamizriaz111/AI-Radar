import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LivePulseBar } from '@/components/intelligence/LivePulseBar';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';
import { getItems } from '@/lib/repositories/itemRepository';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { mapItemToCardItem } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Frontier Models & Research — Live Radar',
  description: 'Foundation model releases, arXiv breakthroughs, and benchmarks explained simply.',
};

export const dynamic = 'force-dynamic';

export default async function ResearchPage() {
  const [report, res] = await Promise.all([
    getDiagnosticsReport(),
    getItems({ categorySlug: 'models', pageSize: 30 }),
  ]);
  const items = res.data;

  return (
    <>
      <TopHeader
        title="Models & Research"
        description="Foundation models, academic breakthroughs, and benchmark developments from global research labs."
      />
      <PageContainer>
        <div className="mb-6">
          <LivePulseBar
            totalItems={report.counts.items || items.length}
            sourcesCount={report.counts.activeSources || 4}
          />
        </div>

        <IntelligenceStreamView
          initialItems={items.map(mapItemToCardItem)}
          totalCount={items.length}
          title="Frontier Models & Academic Research"
          description="Research papers, model weights, and benchmark results from arXiv, Hugging Face, and verified frontier labs. Everything links directly to primary sources."
          showCategoryFilter={false}
          showFullStreamLink={false}
          emptyIconName="flask"
          emptyTitle="No research items yet."
          emptyDescription="No research papers or model evaluations have been indexed in the current cycle. New arXiv preprints and benchmark results appear automatically upon ingestion."
        />
      </PageContainer>
    </>
  );
}
