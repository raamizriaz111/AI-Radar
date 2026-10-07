import { describe, it, expect } from 'vitest';
import { worldNewsCollector } from '@/lib/collectors/news';
import { getCollector, listCollectors } from '@/lib/collectors/registry';

describe('WorldNewsCollector', () => {
  it('is registered in collector registry', () => {
    const collector = getCollector('world-ai-news');
    expect(collector).not.toBeNull();
    expect(collector?.displayName).toBe('World AI News');
    expect(collector?.slug).toBe('world-ai-news');

    const all = listCollectors();
    expect(all.some((c) => c.slug === 'world-ai-news')).toBe(true);
  });

  it('has valid metadata and feeds configuration', () => {
    expect(worldNewsCollector.slug).toBe('world-ai-news');
    expect(worldNewsCollector.displayName).toBe('World AI News');
  });
});
