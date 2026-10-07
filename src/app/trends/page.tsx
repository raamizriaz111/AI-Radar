import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { getAllTrends } from '@/lib/repositories/trendRepository';
import { TrendsView } from '@/components/intelligence/TrendsView';

export const metadata: Metadata = {
  title: "What's Growing in AI",
  description: 'Topics and technologies that are getting more attention across many different news sources right now.',
};

export const dynamic = 'force-dynamic';

export default async function TrendsPage() {
  const initialTrends = await getAllTrends({ limit: 50 });

  return (
    <>
      <TopHeader
        title="What's Growing in AI"
        description="Topics that keep coming up across many different sources — a sign they're becoming more important."
      />
      <PageContainer>
        <SectionHeader
          title="Topics Getting More Attention"
          description="These are subjects that are showing up in many different AI news sources at the same time. The more sources that mention something, the more confident we are it matters."
        />
        <TrendsView initialTrends={initialTrends} />
      </PageContainer>
    </>
  );
}
