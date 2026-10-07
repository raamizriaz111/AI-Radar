// =============================================================================
// AI Radar — Cache Isolation Service (Phase 7)
// =============================================================================
// Strictly separates global cached intelligence from user-scoped personalized cache.
// Prevents cross-user cache collisions and privacy leakage.
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache stores
const globalCache: Map<string, CacheEntry<unknown>> = new Map();
const userCache: Map<string, CacheEntry<unknown>> = new Map();

/**
 * Generates a global cache key (for items, sources, canonical trends).
 */
export function makeGlobalCacheKey(namespace: string, id: string): string {
  return `global:${namespace}:${id}`;
}

/**
 * Generates an isolated user-scoped cache key (for feeds, personal briefings, relevance).
 */
export function makeUserCacheKey(userId: string, namespace: string, id: string): string {
  if (!userId) {
    throw new Error('UserId is required for user-scoped cache keys');
  }
  return `user:${userId}:${namespace}:${id}`;
}

// Cache performance instrumentation (Phase 9)
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheMetrics(): { hits: number; misses: number; hitRate: number; totalKeys: number } {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? Math.round((cacheHits / total) * 100) : 0;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate,
    totalKeys: globalCache.size + userCache.size,
  };
}

export function resetCacheMetrics(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Gets an entry from the global cache.
 */
export function getGlobalCache<T>(namespace: string, id: string): T | null {
  const key = makeGlobalCacheKey(namespace, id);
  const entry = globalCache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key);
    cacheMisses++;
    return null;
  }

  cacheHits++;
  return entry.value as T;
}

/**
 * Sets an entry in the global cache.
 */
export function setGlobalCache<T>(
  namespace: string,
  id: string,
  value: T,
  ttlMs: number = 300_000 // 5 minutes default
): void {
  const key = makeGlobalCacheKey(namespace, id);
  globalCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Gets an entry from the user-scoped cache.
 */
export function getUserCache<T>(userId: string, namespace: string, id: string): T | null {
  const key = makeUserCacheKey(userId, namespace, id);
  const entry = userCache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    userCache.delete(key);
    cacheMisses++;
    return null;
  }

  cacheHits++;
  return entry.value as T;
}

/**
 * Sets an entry in the user-scoped cache.
 */
export function setUserCache<T>(
  userId: string,
  namespace: string,
  id: string,
  value: T,
  ttlMs: number = 180_000 // 3 minutes default for personalized data
): void {
  const key = makeUserCacheKey(userId, namespace, id);
  userCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidates all cache entries for a specific user (on profile update or deletion).
 */
export function invalidateUserCache(userId: string): void {
  const prefix = `user:${userId}:`;
  for (const key of userCache.keys()) {
    if (key.startsWith(prefix)) {
      userCache.delete(key);
    }
  }
}

/**
 * Clears all caches (useful in testing).
 */
export function clearAllCaches(): void {
  globalCache.clear();
  userCache.clear();
}

