'use client';

import { useState, useEffect, useCallback } from 'react';
import { IntelligenceItemWithSummary } from '@/lib/types';
import {
  isLocallyBookmarked,
  saveStoryBookmark,
  removeStoryBookmark,
  subscribeToBookmarks,
} from '@/lib/bookmarks/clientBookmarks';

export function useBookmarkStatus(
  item: IntelligenceItemWithSummary,
  customOnBookmark?: (id: string) => void
) {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    return Boolean(item.isBookmarked);
  });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check initial local storage bookmark status
    const locallySaved = isLocallyBookmarked(item.id);
    if (locallySaved || item.isBookmarked) {
      setIsBookmarked(true);
    } else {
      setIsBookmarked(false);
    }

    // Subscribe to cross-card and cross-tab bookmark updates
    const unsubscribe = subscribeToBookmarks((detail) => {
      if (!detail.itemId || detail.itemId === item.id) {
        setIsBookmarked(isLocallyBookmarked(item.id));
      }
    });

    return unsubscribe;
  }, [item.id, item.isBookmarked]);

  const handleToggle = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const currentlySaved = isBookmarked;
      // Optimistic UI state flip
      setIsBookmarked(!currentlySaved);

      // Call parent callback if provided
      if (customOnBookmark) {
        customOnBookmark(item.id);
      }

      // Explicitly execute unsave vs save
      try {
        if (currentlySaved) {
          await removeStoryBookmark(item.id);
        } else {
          await saveStoryBookmark(item);
        }
      } catch (err) {
        console.warn('Bookmark action sync warning', err);
      }
    },
    [isBookmarked, item, customOnBookmark]
  );

  return { isBookmarked, handleToggle, isHovered, setIsHovered };
}
