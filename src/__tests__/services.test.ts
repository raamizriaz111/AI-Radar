import { describe, it, expect, vi } from 'vitest';
import { computeContentHash, normalizeText } from '@/lib/services/hash';
import { logger } from '@/lib/services/logger';
import { isDatabaseConfigured } from '@/lib/supabase/config';

describe('Hash & Normalization Services', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeText('  GPT-4   Advances  ')).toBe('gpt-4 advances');
  });

  it('produces identical 64-char hex hashes for equivalent inputs', () => {
    const hash1 = computeContentHash({
      canonicalUrl: 'https://example.com/item-1',
      title: 'New AI Breakthrough',
      description: 'Study details here',
    });

    const hash2 = computeContentHash({
      canonicalUrl: 'https://example.com/item-1 ',
      title: '  new ai breakthrough  ',
      description: 'Study details here  ',
    });

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for distinct URLs or titles', () => {
    const hash1 = computeContentHash({
      canonicalUrl: 'https://example.com/item-1',
      title: 'Title A',
    });
    const hash2 = computeContentHash({
      canonicalUrl: 'https://example.com/item-2',
      title: 'Title A',
    });
    expect(hash1).not.toBe(hash2);
  });
});

describe('Database Configuration Guard', () => {
  it('identifies placeholder values as not configured', () => {
    // Current environment has placeholder values
    expect(isDatabaseConfigured()).toBe(false);
  });
});

describe('Logger Sanitization', () => {
  it('redacts sensitive credentials from log output', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.info('Test log', {
      api_key: 'sk-secretkey1234567890123456',
      normalField: 'safeValue',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logOutput = consoleSpy.mock.calls[0][1];
    expect(logOutput).toContain('[REDACTED]');
    expect(logOutput).not.toContain('sk-secretkey');
    expect(logOutput).toContain('safeValue');

    consoleSpy.mockRestore();
  });
});
