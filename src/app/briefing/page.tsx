import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { getLatestBriefing, getBriefingHistory } from '@/lib/repositories/briefingRepository';
import { BriefingView } from '@/components/intelligence/BriefingView';

export const metadata: Metadata = {
  title: "Today's AI Briefing",
  description: 'A plain-English summary of the most important things happening in AI today, with links to original sources.',
};

export const dynamic = 'force-dynamic';

export default async function BriefingPage() {
  const currentBriefing = await getLatestBriefing();
  const history = await getBriefingHistory(14);

  return (
    <>
      <TopHeader
        title="Today's AI Briefing"
        description="The most important things happening in AI today, explained in plain English."
      />
      <PageContainer>
        <SectionHeader
          title="Today's AI Briefing"
          description="Everything here links back to its original source so you can read the full story yourself. We never make things up."
        />
        <BriefingView currentBriefing={currentBriefing} history={history} />
      </PageContainer>
    </>
  );
}
