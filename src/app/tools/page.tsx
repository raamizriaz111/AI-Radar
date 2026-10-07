import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LivePulseBar } from '@/components/intelligence/LivePulseBar';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';
import { getItems } from '@/lib/repositories/itemRepository';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { mapItemToCardItem } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'AI Tools & Applications — Live Radar',
  description: 'Verified AI-powered tools, utilities, and developer applications.',
};

export const dynamic = 'force-dynamic';

export default async function ToolsPage() {
  const [report, res] = await Promise.all([
    getDiagnosticsReport(),
    getItems({ categorySlug: 'ai-tools', pageSize: 30 }),
  ]);
  const items = res.data;

  return (
    <>
      <TopHeader
        title="AI Tools & Applications"
        description="Every tool verified with its official source, release date, and capabilities."
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
          title="Verified AI Tools & Software"
          description="Tools for writing, multimodal generation, coding, analysis, and developer workflow automation. Everything links to the original verified source."
          showCategoryFilter={false}
          showFullStreamLink={false}
          emptyIconName="wrench"
          emptyTitle="No tools catalogued yet."
          emptyDescription="No AI tools matching this category have been indexed in the latest radar cycle. New releases and tool reviews will appear automatically as feeds sync."
        />
      </PageContainer>
    </>
  );
}
