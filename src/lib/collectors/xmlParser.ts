// =============================================================================
// AI Radar — XML / Atom Feed Parser (Phase 3)
// =============================================================================
// A lightweight, dependency-free XML/Atom parser for RSS and Atom feeds.
// Uses the Node.js built-in DOMParser (available in Next.js server runtime).
//
// SECURITY: All parsed values are treated as untrusted external content.
// The parser does not execute content, follow external entity references,
// or interpret embedded scripts or instructions.
// =============================================================================

/**
 * A single entry extracted from an Atom or RSS feed.
 */
export interface FeedEntry {
  id: string;
  title: string;
  link: string;
  summary: string;
  published: string | null;
  updated: string | null;
  authors: string[];
  categories: string[];
  rawXml?: string;
}

/**
 * Safely extract text content from an XML element by tag name.
 */
function getText(parent: Element | Document, tagName: string): string {
  const el = parent.querySelector(tagName);
  return el?.textContent?.trim() ?? '';
}

/**
 * Get all elements matching a tag name.
 */
function getAll(parent: Element | Document, tagName: string): Element[] {
  return Array.from(parent.querySelectorAll(tagName));
}

/**
 * Parse an Atom or RSS feed XML string into structured entries.
 *
 * @param xmlText - Raw XML text from the feed.
 * @returns Array of parsed feed entries.
 */
export function parseFeed(xmlText: string): FeedEntry[] {
  let doc: Document;

  try {
    // Use JSDOM or native DOMParser depending on runtime
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(xmlText, 'application/xml');
    } else {
      // Node.js server environment — use a minimal XML parser
      return parseXmlMinimal(xmlText);
    }
  } catch {
    return [];
  }

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return [];
  }

  const isAtom = doc.querySelector('feed') !== null;

  if (isAtom) {
    return parseAtom(doc);
  }

  return parseRss(doc);
}

function parseAtom(doc: Document): FeedEntry[] {
  return getAll(doc, 'entry').map((entry) => {
    const id = getText(entry, 'id');
    const title = getText(entry, 'title');
    const published = getText(entry, 'published') || getText(entry, 'updated') || null;
    const updated = getText(entry, 'updated') || null;

    // link: prefer alternate rel, fallback to first
    let link = '';
    const links = getAll(entry, 'link');
    const altLink = links.find((l) => l.getAttribute('rel') === 'alternate' || !l.getAttribute('rel'));
    if (altLink) {
      link = altLink.getAttribute('href') ?? '';
    }
    if (!link) {
      link = getText(entry, 'link');
    }

    const summary = getText(entry, 'summary') || getText(entry, 'content');

    const authors = getAll(entry, 'author').map((a) => getText(a, 'name')).filter(Boolean);

    const categories = getAll(entry, 'category')
      .map((c) => c.getAttribute('term') ?? c.textContent?.trim() ?? '')
      .filter(Boolean);

    return { id, title, link, summary, published, updated, authors, categories };
  });
}

function parseRss(doc: Document): FeedEntry[] {
  return getAll(doc, 'item').map((item) => {
    const id = getText(item, 'guid') || getText(item, 'link');
    const title = getText(item, 'title');
    const link = getText(item, 'link');
    const summary = getText(item, 'description');
    const published = getText(item, 'pubDate') || null;

    const authors = [getText(item, 'author'), getText(item, 'dc\\:creator')]
      .filter(Boolean);

    const categories = getAll(item, 'category')
      .map((c) => c.textContent?.trim() ?? '')
      .filter(Boolean);

    return { id, title, link, summary, published: toIso(published), updated: null, authors, categories };
  });
}

/**
 * Convert RSS pubDate string to ISO 8601 (best-effort).
 */
function toIso(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Minimal regex-based XML parser for Node.js server runtime
// (fallback when DOMParser is not available)
// ---------------------------------------------------------------------------

function parseXmlMinimal(xmlText: string): FeedEntry[] {
  const entries: FeedEntry[] = [];

  // Match <entry> blocks (Atom)
  const entryPattern = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(xmlText)) !== null) {
    const block = match[1];

    const id = extractTag(block, 'id') ?? '';
    const title = stripCdata(extractTag(block, 'title') ?? '');
    const summary = stripCdata(extractTag(block, 'summary') ?? extractTag(block, 'content') ?? '');
    const published = extractTag(block, 'published') ?? extractTag(block, 'updated') ?? null;
    const updated = extractTag(block, 'updated') ?? null;

    // Extract href from <link href="..." rel="alternate" />
    const linkMatch = block.match(/<link[^>]+href="([^"]+)"[^>]*(?:rel="alternate")?/i)
      ?? block.match(/<link[^>]+(?:rel="alternate")[^>]+href="([^"]+)"/i);
    const link = linkMatch ? linkMatch[1] : (extractTag(block, 'link') ?? '');

    // Authors
    const authorBlocks = extractAll(block, 'author');
    const authors = authorBlocks
      .map((a) => extractTag(a, 'name') ?? '')
      .filter(Boolean);

    // Categories
    const categories = extractAttributes(block, 'category', 'term');

    entries.push({ id, title, link, summary, published, updated, authors, categories });
  }

  if (entries.length > 0) return entries;

  // Fallback: match <item> blocks (RSS)
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  while ((match = itemPattern.exec(xmlText)) !== null) {
    const block = match[1];
    const id = extractTag(block, 'guid') ?? extractTag(block, 'link') ?? '';
    const title = stripCdata(extractTag(block, 'title') ?? '');
    const link = extractTag(block, 'link') ?? '';
    const summary = stripCdata(extractTag(block, 'description') ?? '');
    const pubDate = extractTag(block, 'pubDate');
    const published = toIso(pubDate ?? null);
    const authors = [extractTag(block, 'author') ?? '', extractTag(block, 'creator') ?? ''].filter(Boolean);
    const categories = extractAll(block, 'category').map((c) => c.trim()).filter(Boolean);

    entries.push({ id, title, link, summary, published, updated: null, authors, categories });
  }

  return entries;
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

function extractAll(xml: string, tag: string): string[] {
  const results: string[] = [];
  const pattern = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

function extractAttributes(xml: string, tag: string, attr: string): string[] {
  const results: string[] = [];
  const pattern = new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

function stripCdata(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}
