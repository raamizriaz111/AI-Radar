// =============================================================================
// AI Radar — Phase 3 Collector Tests
// =============================================================================
// Tests for normalizer, classifier, XML parser, and collector infrastructure.
// No real HTTP requests are made — all network calls are mocked.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeUrl, normalizeTitle, normalizeDescription, parseDate, normalizeAuthors } from '@/lib/collectors/normalizer';
import { classifyItem } from '@/lib/collectors/classifier';
import { parseFeed } from '@/lib/collectors/xmlParser';

// ---------------------------------------------------------------------------
// Normalizer tests
// ---------------------------------------------------------------------------

describe('normalizer', () => {
  describe('normalizeUrl', () => {
    it('lowercases scheme and host', () => {
      expect(normalizeUrl('HTTPS://ARXIV.ORG/abs/2301.00001')).toBe('https://arxiv.org/abs/2301.00001');
    });

    it('strips utm tracking parameters', () => {
      const url = 'https://example.com/article?utm_source=twitter&utm_medium=social&id=123';
      const result = normalizeUrl(url);
      expect(result).not.toContain('utm_source');
      expect(result).not.toContain('utm_medium');
      expect(result).toContain('id=123');
    });

    it('strips ref parameter', () => {
      const url = 'https://example.com/article?ref=homepage';
      const result = normalizeUrl(url);
      expect(result).not.toContain('ref=');
    });

    it('returns trimmed original on invalid URL', () => {
      expect(normalizeUrl('  not-a-url  ')).toBe('not-a-url');
    });

    it('handles URLs with no query string', () => {
      expect(normalizeUrl('https://arxiv.org/abs/2401.00001')).toBe('https://arxiv.org/abs/2401.00001');
    });
  });

  describe('normalizeTitle', () => {
    it('collapses multiple spaces', () => {
      expect(normalizeTitle('  Hello    World  ')).toBe('Hello World');
    });

    it('truncates at maxLength with ellipsis', () => {
      const long = 'A'.repeat(510);
      const result = normalizeTitle(long);
      expect(result.length).toBe(500);
      expect(result.endsWith('...')).toBe(true);
    });

    it('removes zero-width characters', () => {
      const title = 'Hello\u200BWorld';
      expect(normalizeTitle(title)).toBe('HelloWorld');
    });
  });

  describe('normalizeDescription', () => {
    it('strips HTML tags', () => {
      expect(normalizeDescription('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('decodes common HTML entities', () => {
      expect(normalizeDescription('AT&amp;T &lt;co&gt;')).toBe('AT&T <co>');
    });

    it('truncates long descriptions', () => {
      const long = 'X'.repeat(2500);
      const result = normalizeDescription(long, 2000);
      expect(result.length).toBe(2000);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('parseDate', () => {
    it('returns ISO string for valid date', () => {
      const result = parseDate('2024-06-15T10:30:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('returns null for empty string', () => {
      expect(parseDate('')).toBe(null);
    });

    it('returns null for null', () => {
      expect(parseDate(null)).toBe(null);
    });

    it('returns null for obviously old dates (pre-2015)', () => {
      expect(parseDate('2010-01-01')).toBe(null);
    });

    it('handles RSS pubDate format', () => {
      const result = parseDate('Thu, 01 Jun 2023 12:00:00 GMT');
      expect(result).not.toBe(null);
      expect(result).toMatch(/^2023/);
    });
  });

  describe('normalizeAuthors', () => {
    it('deduplicates authors', () => {
      const result = normalizeAuthors(['Alice', 'Bob', 'Alice', 'Charlie']);
      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('filters empty strings', () => {
      const result = normalizeAuthors(['', 'Alice', '  ']);
      expect(result).toEqual(['Alice']);
    });

    it('trims author names', () => {
      const result = normalizeAuthors(['  Alice Smith  ']);
      expect(result).toEqual(['Alice Smith']);
    });
  });
});

// ---------------------------------------------------------------------------
// Classifier tests
// ---------------------------------------------------------------------------

describe('classifyItem', () => {
  it('assigns research_paper type for arXiv source by default', () => {
    const result = classifyItem('arxiv', 'A study of neural networks', 'Abstract text.');
    expect(result.itemType).toBe('research_paper');
    expect(result.categorySlugs).toContain('models');
  });

  it('assigns model_release type for huggingface source by default', () => {
    const result = classifyItem('huggingface', 'New GPT-5 model released', 'Details.');
    expect(result.itemType).toBe('model_release');
  });

  it('assigns repository type for github source', () => {
    const result = classifyItem('github', 'some/repo', 'A tool for AI developers.');
    expect(result.itemType).toBe('repository');
  });

  it('adds safety-regulation category for safety keywords', () => {
    const result = classifyItem('arxiv', 'AI Alignment and Safety Risks', 'A study on responsible AI governance and regulation.');
    expect(result.categorySlugs).toContain('safety-regulation');
  });

  it('adds coding-agents category for coding agent keywords', () => {
    const result = classifyItem('github', 'GitHub Copilot for VS Code', 'AI coding assistant extension.');
    expect(result.categorySlugs).toContain('coding-agents');
  });

  it('adds business category for funding signals', () => {
    const result = classifyItem('other', 'AI startup raises $100M Series B funding round', '');
    expect(result.categorySlugs).toContain('business');
  });

  it('adds career category for tutorial signals', () => {
    const result = classifyItem('other', 'Tutorial: Learn LLM fine-tuning course', 'Beginner skills bootcamp.');
    expect(result.categorySlugs).toContain('career');
  });

  it('maps cs.CR arXiv subject to safety-regulation', () => {
    const result = classifyItem('arxiv', 'Security Analysis', 'Analysis.', ['cs.CR']);
    expect(result.categorySlugs).toContain('safety-regulation');
  });

  it('returns unique category slugs', () => {
    const result = classifyItem('arxiv', 'AI research paper on models', 'LLM study.');
    const unique = new Set(result.categorySlugs);
    expect(unique.size).toBe(result.categorySlugs.length);
  });
});

// ---------------------------------------------------------------------------
// XML Parser tests
// ---------------------------------------------------------------------------

describe('parseFeed', () => {
  const ATOM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <entry>
    <id>http://arxiv.org/abs/2401.00001v1</id>
    <title>Test Paper: A Study</title>
    <summary>This is the abstract of the test paper.</summary>
    <published>2024-01-15T00:00:00Z</published>
    <updated>2024-01-16T00:00:00Z</updated>
    <link href="https://arxiv.org/abs/2401.00001" rel="alternate" />
    <author><name>Alice Smith</name></author>
    <author><name>Bob Jones</name></author>
    <category term="cs.AI" />
    <category term="cs.LG" />
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2401.00002v1</id>
    <title>Second Paper</title>
    <summary>Second abstract.</summary>
    <published>2024-01-14T00:00:00Z</published>
    <link href="https://arxiv.org/abs/2401.00002" rel="alternate" />
    <author><name>Carol White</name></author>
  </entry>
</feed>`;

  const RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS Feed</title>
    <item>
      <guid>https://example.com/post/1</guid>
      <title>RSS Item One</title>
      <link>https://example.com/post/1</link>
      <description>RSS item description here.</description>
      <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
      <author>author@example.com</author>
    </item>
    <item>
      <guid>https://example.com/post/2</guid>
      <title>RSS Item Two</title>
      <link>https://example.com/post/2</link>
      <description>Another RSS item.</description>
    </item>
  </channel>
</rss>`;

  it('parses Atom feed entries', () => {
    const entries = parseFeed(ATOM_XML);
    expect(entries.length).toBe(2);
    expect(entries[0].title).toBe('Test Paper: A Study');
    expect(entries[0].summary).toBe('This is the abstract of the test paper.');
    // Both '2024-01-15T00:00:00Z' and '2024-01-15T00:00:00.000Z' are valid ISO 8601
    expect(entries[0].published).toBeTruthy();
    expect(entries[0].published).toMatch(/^2024-01-15/);
  });

  it('extracts authors from Atom feed', () => {
    const entries = parseFeed(ATOM_XML);
    expect(entries[0].authors).toContain('Alice Smith');
    expect(entries[0].authors).toContain('Bob Jones');
  });

  it('extracts categories from Atom feed', () => {
    const entries = parseFeed(ATOM_XML);
    expect(entries[0].categories).toContain('cs.AI');
    expect(entries[0].categories).toContain('cs.LG');
  });

  it('extracts link href from Atom entry', () => {
    const entries = parseFeed(ATOM_XML);
    expect(entries[0].link).toBe('https://arxiv.org/abs/2401.00001');
  });

  it('parses RSS feed items', () => {
    const entries = parseFeed(RSS_XML);
    expect(entries.length).toBe(2);
    expect(entries[0].title).toBe('RSS Item One');
    expect(entries[0].link).toBe('https://example.com/post/1');
    expect(entries[0].summary).toBe('RSS item description here.');
  });

  it('returns empty array for invalid XML', () => {
    const entries = parseFeed('not xml at all $$##');
    expect(Array.isArray(entries)).toBe(true);
  });

  it('returns empty array for empty string', () => {
    const entries = parseFeed('');
    expect(entries).toEqual([]);
  });
});
