import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LivePulseBar } from '@/components/intelligence/LivePulseBar';
import { IntelligenceStreamView } from '@/components/intelligence/IntelligenceStreamView';
import { getItems } from '@/lib/repositories/itemRepository';
import { getDiagnosticsReport } from '@/lib/services/diagnosticsService';
import { mapItemToCardItem } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Autonomous Coding Agents & DevTools — Live Radar',
  description: 'AI coding assistants, autonomous agents, and software engineering frameworks.',
};

export const dynamic = 'force-dynamic';

export default async function CodingAgentsPage() {
  const [report, res] = await Promise.all([
    getDiagnosticsReport(),
    getItems({ categorySlug: 'coding-agents', pageSize: 30 }),
  ]);
  const items = res.data;

  return (
    <>
      <TopHeader
        title="Coding Agents & Dev Automation"
        description="Autonomous coding agents, IDE extensions, and developer frameworks that build software."
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
          title="Autonomous Coding Agents & DevTools"
          description="Autonomous coding assistants, multi-agent frameworks, and software workflow automation tracked from official release notes and documentation."
          showCategoryFilter={false}
          showFullStreamLink={false}
          emptyIconName="bot"
          emptyTitle="No coding agents catalogued yet."
          emptyDescription="Autonomous coding agents and developer frameworks are continuously tracked from official releases. New items will populate here as signals are detected."
        />
      </PageContainer>
    </>
  );
}
