import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LivePulseBar } from '@/components/intelligence/LivePulseBar';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';
import { getItems } from '@/lib/repositories/itemRepository';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { mapItemToCardItem } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'AI Safety & Regulatory Radar — Live Radar',
  description: 'Global regulations, compliance timelines, and frontier safety benchmarks.',
};

export const dynamic = 'force-dynamic';

export default async function SafetyPage() {
  const [report, res] = await Promise.all([
    getDiagnosticsReport(),
    getItems({ categorySlug: 'safety-regulation', pageSize: 30 }),
  ]);
  const items = res.data;

  return (
    <>
      <TopHeader
        title="Safety & Regulation"
        description="Global policies, government frameworks, legal precedents, and frontier safety research."
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
          title="AI Safety, Governance & Policy"
          description="Track how regulatory bodies, international standards, and frontier research institutions are evaluating AI safety and alignment."
          showCategoryFilter={false}
          showFullStreamLink={false}
          emptyIconName="shield"
          emptyTitle="No safety stories yet."
          emptyDescription="No regulatory filings or AI safety publications match this view right now. Government frameworks and policy updates appear as new briefs are published."
        />
      </PageContainer>
    </>
  );
}
