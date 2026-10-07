import type { Metadata } from 'next';
import { TopHeader } from '@/components/layout/TopHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserBookmarks } from '@/lib/repositories/bookmarkRepository';
import { getSavedIntelligence } from '@/lib/repositories/personalizationRepository';
import { mapItemToCardItem } from '@/lib/utils';
import { SavedStoriesClient } from '@/components/bookmarks/SavedStoriesClient';

export const metadata: Metadata = {
  title: 'Saved Intelligence & Reading Portfolio — AI Radar',
  description: 'Your personal portfolio of saved articles, frontier papers, trends, and project ideas.',
};

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  const userId = user?.id || 'default';

  // Fetch bookmarked articles and multi-entity saved intelligence concurrently
  const [{ data: bookmarkedItems }, savedEntities] = await Promise.all([
    getUserBookmarks(userId),
    getSavedIntelligence(userId),
  ]);

  const mappedItems = bookmarkedItems.map(mapItemToCardItem);

  return (
    <>
      <TopHeader
        title="Saved Intelligence"
        description="Your personal portfolio of saved articles, frontier papers, trends, and project opportunities."
      />
      <PageContainer className="space-y-6">
        <SavedStoriesClient
          initialBookmarkedItems={mappedItems}
          initialSavedEntities={savedEntities}
          isAuthenticated={Boolean(user)}
        />
      </PageContainer>
    </>
  );
}
