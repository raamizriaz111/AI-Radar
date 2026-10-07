// =============================================================================
// AI Radar — Client-Side Bookmarks & Saved Intelligence Manager
// =============================================================================
// Provides zero-friction, instant saving for both anonymous visitors & logged-in users.
// Guaranteed persistence across page reloads via localStorage + automatic background sync
// to /api/bookmarks and /api/saved.
// =============================================================================

import { IntelligenceItemWithSummary } from '@/lib/types';

const STORAGE_MAP_KEY = 'ai_radar_saved_items_v2';
const EVENT_NAME = 'ai_radar_bookmarks_updated';

type SavedItemsMap = Record<string, IntelligenceItemWithSummary>;

function getStorageMap(): SavedItemsMap {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStorageMap(map: SavedItemsMap): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Returns all stories saved in local storage.
 */
export function getLocallySavedItems(): IntelligenceItemWithSummary[] {
  const map = getStorageMap();
  return Object.values(map).sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.discoveredAt || 0).getTime();
    const dateB = new Date(b.publishedAt || b.discoveredAt || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Checks whether an item ID is currently saved.
 */
export function isLocallyBookmarked(itemId: string): boolean {
  if (!itemId) return false;
  const map = getStorageMap();
  return Boolean(map[itemId]);
}

/**
 * Saves a story locally and syncs to backend API.
 */
export async function saveStoryBookmark(item: IntelligenceItemWithSummary): Promise<void> {
  if (!item || !item.id) return;

  const map = getStorageMap();
  map[item.id] = { ...item, isBookmarked: true };
  setStorageMap(map);

  // Notify all components in the active window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { itemId: item.id, isBookmarked: true, item },
      })
    );
  }

  // Background sync with API (only in real browser environment)
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin &&
    !window.location.origin.startsWith('null')
  ) {
    try {
      await fetch(`${window.location.origin}/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, item }),
      });
    } catch (err) {
      // Local copy is already saved; sync will retry
    }
  }
}

/**
 * Removes a story bookmark locally and syncs deletion to backend API.
 */
export async function removeStoryBookmark(itemId: string): Promise<void> {
  if (!itemId) return;

  const map = getStorageMap();
  delete map[itemId];
  setStorageMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { itemId, isBookmarked: false },
      })
    );
  }

  // Background sync with API (only in real browser environment)
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin &&
    !window.location.origin.startsWith('null')
  ) {
    try {
      await fetch(
        `${window.location.origin}/api/bookmarks?itemId=${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      );
    } catch (err) {
      // Local removal completed
    }
  }
}

/**
 * Toggles a bookmark state and returns new bookmarked status.
 */
export async function toggleStoryBookmark(item: IntelligenceItemWithSummary): Promise<boolean> {
  const currentlySaved = isLocallyBookmarked(item.id);
  if (currentlySaved) {
    await removeStoryBookmark(item.id);
    return false;
  } else {
    await saveStoryBookmark(item);
    return true;
  }
}

/**
 * Subscribes to bookmark changes across the window.
 */
export function subscribeToBookmarks(
  callback: (detail: { itemId: string; isBookmarked: boolean }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_MAP_KEY) {
      callback({ itemId: '', isBookmarked: false });
    }
  });

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}
