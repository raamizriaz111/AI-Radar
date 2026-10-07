import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/intelligence/SectionHeader';
import { getAllTrends, saveTrendsBatch } from '@/lib/repositories/trendRepository';
import { getItems } from '@/lib/repositories/itemRepository';
import { discoverTrends } from '@/lib/intelligence/trendDiscovery';
import { TrendsView } from '@/components/intelligence/TrendsView';

export const metadata: Metadata = {
  title: "What's Growing in AI — Emerging Trends",
  description: 'Topics and technologies that are getting more attention across many different news sources right now.',
};

export const dynamic = 'force-dynamic';

export default async function TrendsPage() {
  let initialTrends = await getAllTrends({ limit: 50 });

  // Resilient auto-discovery: if trends have not been computed, discover them on the fly
  if (initialTrends.length === 0) {
    try {
      const itemsRes = await getItems({ pageSize: 80 });
      if (itemsRes.data.length > 0) {
        const discovered = await discoverTrends(itemsRes.data);
        if (discovered.length > 0) {
          await saveTrendsBatch(discovered);
          initialTrends = await getAllTrends({ limit: 50 });
        }
      }
    } catch {
      // Safe fallback
    }
  }

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
