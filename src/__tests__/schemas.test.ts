import { describe, it, expect } from 'vitest';
import {
  CreateSourceSchema,
  CreateItemSchema,
  CreateBookmarkSchema,
  CreateCollectionRunSchema,
  CreateSummarySchema,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('CreateSourceSchema', () => {
    it('validates a correct source input', () => {
      const valid = {
        name: 'arXiv AI',
        source_type: 'research',
        base_url: 'https://arxiv.org',
        feed_url: 'https://arxiv.org/rss/cs.AI',
        description: 'Computer Science AI papers',
        trust_level: 1,
        active: true,
      };
      const result = CreateSourceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid base_url', () => {
      const invalid = {
        name: 'Invalid Source',
        source_type: 'news',
        base_url: 'not-a-valid-url',
      };
      const result = CreateSourceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects an unknown source_type', () => {
      const invalid = {
        name: 'Invalid Type',
        source_type: 'unknown_type',
        base_url: 'https://example.com',
      };
      const result = CreateSourceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateItemSchema', () => {
    it('validates a correct item input', () => {
      const valid = {
        source_id: '123e4567-e89b-12d3-a456-426614174000',
        canonical_url: 'https://arxiv.org/abs/2401.00001',
        title: 'Advances in Foundation Models',
        description: 'A study on model architectures.',
        item_type: 'research_paper',
        category_slugs: ['models', 'research'],
      };
      const result = CreateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid UUID for source_id', () => {
      const invalid = {
        source_id: 'non-uuid-string',
        canonical_url: 'https://arxiv.org/abs/2401.00001',
        title: 'Title',
        item_type: 'research_paper',
      };
      const result = CreateItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty title', () => {
      const invalid = {
        source_id: '123e4567-e89b-12d3-a456-426614174000',
        canonical_url: 'https://arxiv.org/abs/2401.00001',
        title: '',
        item_type: 'research_paper',
      };
      const result = CreateItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateBookmarkSchema', () => {
    it('accepts valid UUIDs for user_id and item_id', () => {
      const valid = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        item_id: '123e4567-e89b-12d3-a456-426614174001',
      };
      const result = CreateBookmarkSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID user_id', () => {
      const invalid = {
        user_id: 'not-a-uuid',
        item_id: '123e4567-e89b-12d3-a456-426614174001',
      };
      const result = CreateBookmarkSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCollectionRunSchema', () => {
    it('validates a collection run with defaults', () => {
      const valid = {
        source_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = CreateCollectionRunSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('running');
        expect(result.data.items_discovered).toBe(0);
      }
    });
  });

  describe('CreateSummarySchema', () => {
    it('validates a summary with confidence between 0 and 1', () => {
      const valid = {
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        model_name: 'gemini-1.5-pro',
        provider: 'google',
        summary: 'This model enhances multi-modal reasoning.',
        confidence: 0.95,
      };
      const result = CreateSummarySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects confidence > 1', () => {
      const invalid = {
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        model_name: 'gemini-1.5-pro',
        provider: 'google',
        summary: 'Summary text',
        confidence: 1.5,
      };
      const result = CreateSummarySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
