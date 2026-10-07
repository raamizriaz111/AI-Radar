// =============================================================================
// AI Radar — Intelligence Layer Unit Tests (Phase 5)
// =============================================================================

import { describe, it, expect } from 'vitest';
import { detectSignals } from '@/lib/intelligence/signals';
import { evaluateTrendLifecycle } from '@/lib/intelligence/lifecycle';
import {
  calculateItemImportance,
  rankItemsForBriefing,
} from '@/lib/intelligence/importance';
import { computeUserRelevance } from '@/lib/intelligence/preferences';
import { discoverTrends } from '@/lib/intelligence/trendDiscovery';
import { generateDailyBriefing } from '@/lib/intelligence/briefingService';
import type { ItemFull } from '@/lib/database.types';
import type { UserPreferences } from '@/lib/types';

// Mock test items
function createMockItem(overrides: Partial<ItemFull> = {}): ItemFull {
  const id = overrides.id || `item-${Math.random().toString(36).substring(7)}`;
  return {
    id,
    source_id: overrides.source_id || 'source-1',
    external_id: overrides.external_id || id,
    canonical_url: overrides.canonical_url || `https://example.com/${id}`,
    title: overrides.title || 'Sample AI Paper on Reasoning Models',
    description: overrides.description || 'A detailed paper about large reasoning models and benchmarks.',
    content_text: overrides.content_text || null,
    authors: overrides.authors || ['Alice Researcher'],
    item_type: overrides.item_type || 'research_paper',
    published_at: overrides.published_at || new Date().toISOString(),
    discovered_at: overrides.discovered_at || new Date().toISOString(),
    content_hash: 'abc123hash',
    metadata: {},
    enrichment_status: 'completed',
    enrichment_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: overrides.source || {
      id: overrides.source_id || 'source-1',
      name: 'arXiv',
      source_type: 'research',
      base_url: 'https://arxiv.org',
      feed_url: null,
      description: null,
      trust_level: 3,
      active: true,
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: overrides.categories || [
      {
        id: 'cat-1',
        slug: 'models',
        label: 'Models & Research',
        description: null,
        sort_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
    summary: overrides.summary !== undefined ? overrides.summary : {
      id: 'sum-1',
      item_id: id,
      model_name: 'test-model',
      provider: 'test-provider',
      summary: 'Executive summary of research findings.',
      key_points: ['Achieves 92% on reasoning benchmark', 'Reduces token latency by 40%'],
      significance: 'Critical improvement in test-time compute.',
      claims: [
        { text: 'Reduces latency by 40%', confidence: 'high', importance: 'high' } as any,
      ],
      confidence: 0.9,
      entities: [{ name: 'DeepSeek', type: 'organization' }] as any,
      technologies: ['DeepSeek-R1', 'Reasoning Models', 'vLLM'] as any,
      topics: ['Reasoning Models', 'Reinforcement Learning'] as any,
      suggested_categories: ['models'] as any,
      suggested_item_type: 'research_paper',
      prompt_version: '1.0.0',
      warning_flags: [] as any,
      usage: {} as any,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

describe('Signal Detection (detectSignals)', () => {
  it('groups items by extracted technology anchor and tracks distinct sources', () => {
    const item1 = createMockItem({
      id: 'it-1',
      source: { id: 's-1', name: 'arXiv', trust_level: 3 } as any,
      summary: {
        technologies: ['vLLM', 'FlashAttention'] as any,
        entities: [] as any,
        topics: ['Serving'] as any,
      } as any,
    });

    const item2 = createMockItem({
      id: 'it-2',
      source: { id: 's-2', name: 'GitHub Trending', trust_level: 2 } as any,
      summary: {
        technologies: ['vLLM', 'Triton'] as any,
        entities: [] as any,
        topics: ['Serving'] as any,
      } as any,
    });

    const signals = detectSignals([item1, item2], 14);
    const vllmSignal = signals.find((s) => s.topic.toLowerCase() === 'vllm');

    expect(vllmSignal).toBeDefined();
    expect(vllmSignal?.itemCount).toBe(2);
    expect(vllmSignal?.distinctSourceCount).toBe(2);
    expect(vllmSignal?.sources).toContain('arXiv');
    expect(vllmSignal?.sources).toContain('GitHub Trending');
  });

  it('enforces source independence rule: duplicate items from same source count as 1 source', () => {
    const item1 = createMockItem({
      id: 'it-1',
      source: { id: 's-1', name: 'Hugging Face Papers', trust_level: 2 } as any,
      summary: {
        technologies: ['LoRA'] as any,
        entities: [] as any,
        topics: ['Fine-Tuning'] as any,
      } as any,
    });

    const item2 = createMockItem({
      id: 'it-2',
      source: { id: 's-1', name: 'Hugging Face Papers', trust_level: 2 } as any,
      summary: {
        technologies: ['LoRA'] as any,
        entities: [] as any,
        topics: ['Fine-Tuning'] as any,
      } as any,
    });

    const signals = detectSignals([item1, item2], 14);
    const loraSignal = signals.find((s) => s.topic.toLowerCase() === 'lora');

    expect(loraSignal).toBeDefined();
    expect(loraSignal?.itemCount).toBe(2);
    expect(loraSignal?.distinctSourceCount).toBe(1); // 1 distinct source!
  });

  it('identifies contradiction indicators in items', () => {
    const item = createMockItem({
      id: 'it-contra',
      title: 'Benchmark Failure and Hallucination Regression in Reasoning Model',
      summary: {
        technologies: ['Model-X'] as any,
        entities: [] as any,
        topics: ['Benchmarks'] as any,
      } as any,
    });

    const otherItem = createMockItem({
      id: 'it-normal',
      title: 'Model-X initial release notes',
      summary: {
        technologies: ['Model-X'] as any,
        entities: [] as any,
        topics: ['Benchmarks'] as any,
      } as any,
    });

    const signals = detectSignals([item, otherItem], 14);
    const signal = signals.find((s) => s.topic.toLowerCase().replace(/[-_]/g, ' ') === 'model x');

    expect(signal).toBeDefined();
    expect(signal?.hasContradictions).toBe(true);
    expect(signal?.contradictionNotes).toBeDefined();
  });
});

describe('Trend Lifecycle & Confidence Evaluation (evaluateTrendLifecycle)', () => {
  it('assigns early_signal for new items with limited sources', () => {
    const res = evaluateTrendLifecycle({
      itemCount: 2,
      distinctSourceCount: 1,
      firstSeenAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
    });

    expect(res.status).toBe('early_signal');
    expect(res.confidence).toBe('low');
  });

  it('transitions to developing with >= 2 distinct sources and accelerating activity', () => {
    const res = evaluateTrendLifecycle({
      itemCount: 4,
      distinctSourceCount: 2,
      firstSeenAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      activityChangePct: 50,
    });

    expect(res.status).toBe('developing');
    expect(res.confidenceScore).toBeGreaterThanOrEqual(0.40);
  });

  it('transitions to established with >= 3 distinct sources and sustained duration', () => {
    const res = evaluateTrendLifecycle({
      itemCount: 7,
      distinctSourceCount: 3,
      firstSeenAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      activityChangePct: 20,
    });

    expect(res.status).toBe('established');
    expect(res.confidence).toBe('high');
    expect(res.confidenceScore).toBeGreaterThanOrEqual(0.70);
  });

  it('marks trend as uncertain when contradictory evidence is reported', () => {
    const res = evaluateTrendLifecycle({
      itemCount: 5,
      distinctSourceCount: 3,
      firstSeenAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      hasContradictions: true,
    });

    expect(res.status).toBe('uncertain');
    expect(res.statusReason).toContain('Contradictory evidence');
  });

  it('marks trend as declining or inactive if no recent items appear', () => {
    const decliningRes = evaluateTrendLifecycle({
      itemCount: 4,
      distinctSourceCount: 2,
      firstSeenAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      lastSeenAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    });
    expect(decliningRes.status).toBe('declining');

    const inactiveRes = evaluateTrendLifecycle({
      itemCount: 4,
      distinctSourceCount: 2,
      firstSeenAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      lastSeenAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    });
    expect(inactiveRes.status).toBe('inactive');
  });
});

describe('Importance Modeling & Ranking (calculateItemImportance & rankItemsForBriefing)', () => {
  const mockPreferences: UserPreferences = {
    topics: ['AI Agents', 'Reasoning Models'],
    categories: ['coding-agents', 'models'],
    interestLevel: {
      'AI Agents': 'high',
      'Reasoning Models': 'high',
    },
  };

  it('computes transparent scores with recency decay and relevance boost', () => {
    const recentItem = createMockItem({
      title: 'New Autonomous AI Agents Framework',
      published_at: new Date().toISOString(),
      summary: {
        topics: ['AI Agents'] as any,
        technologies: ['Agents'] as any,
        key_points: ['Point 1', 'Point 2', 'Point 3'] as any,
        claims: [{ text: 'Claim 1' }, { text: 'Claim 2' }] as any,
      } as any,
    });

    const oldItem = createMockItem({
      title: 'Legacy NLP methods from 2020',
      published_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      summary: {
        topics: ['Grammar'] as any,
        technologies: [] as any,
      } as any,
    });

    const recentScore = calculateItemImportance(recentItem, mockPreferences);
    const oldScore = calculateItemImportance(oldItem, mockPreferences);

    expect(recentScore.scores.recencyScore).toBeGreaterThan(oldScore.scores.recencyScore);
    expect(recentScore.scores.userRelevanceScore).toBeGreaterThan(oldScore.scores.userRelevanceScore);
    expect(recentScore.scores.totalScore).toBeGreaterThan(oldScore.scores.totalScore);
    expect(recentScore.matchedTopics).toContain('AI Agents');
  });

  it('filters near-duplicate titles for novelty in briefing ranking', () => {
    const item1 = createMockItem({
      id: 'paper-v1',
      title: 'DeepSeek-R1 Technical Report: Incentivizing Reasoning in LLMs',
    });

    const item2 = createMockItem({
      id: 'paper-v2',
      title: 'DeepSeek-R1 Technical Report: Incentivizing Reasoning in LLMs via Reinforcement Learning',
    });

    const item3 = createMockItem({
      id: 'different-paper',
      title: 'FlashAttention-3: Fast and Memory-Efficient Exact Attention',
    });

    const ranked = rankItemsForBriefing([item1, item2, item3], mockPreferences, 10);

    // One of the DeepSeek duplicates should be eliminated for novelty
    const deepSeekItems = ranked.filter((r) => r.item.title.includes('DeepSeek-R1'));
    expect(deepSeekItems.length).toBe(1);
    expect(ranked.some((r) => r.item.id === 'different-paper')).toBe(true);
  });
});

describe('User Preferences & Relevance (computeUserRelevance)', () => {
  it('correctly matches explicit topics in title or summary', () => {
    const prefs: UserPreferences = {
      topics: ['Quantization', 'Inference'],
      categories: ['ai-tools'],
      interestLevel: { Quantization: 'high', Inference: 'medium' },
    };

    const item = createMockItem({
      title: 'BitNet b1.58: 1-bit LLM Quantization for ultra-low latency inference',
    });

    const rel = computeUserRelevance(item, prefs);
    expect(rel.score).toBeGreaterThan(0.5);
    expect(rel.matchedTopics).toContain('Quantization');
    expect(rel.reason).toContain('Quantization');
  });
});

describe('Trend Discovery (discoverTrends)', () => {
  it('discovers and clusters trend candidates with evidence relationships and timeline', async () => {
    const item1 = createMockItem({
      id: 't-1',
      source: { id: 's-1', name: 'arXiv', trust_level: 3 } as any,
      published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      summary: {
        technologies: ['Speculative Decoding'] as any,
        topics: ['Inference'] as any,
        significance: 'Doubles decoding speed.',
      } as any,
    });

    const item2 = createMockItem({
      id: 't-2',
      source: { id: 's-2', name: 'GitHub', trust_level: 2 } as any,
      published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      summary: {
        technologies: ['Speculative Decoding'] as any,
        topics: ['Inference'] as any,
        significance: 'Production implementation released.',
      } as any,
    });

    const trends = await discoverTrends([item1, item2]);
    const trend = trends.find((t) => t.slug.includes('speculative-decoding'));

    expect(trend).toBeDefined();
    expect(trend?.distinctSourceCount).toBe(2);
    expect(trend?.timeline.length).toBe(2);
    expect(trend?.evidence.length).toBe(2);
    expect(trend?.evidence[0].relationshipType).toBe('supporting');
  });
});

describe('Daily Briefing Generation (generateDailyBriefing)', () => {
  it('generates a briefing with sections and cited items', async () => {
    const briefing = await generateDailyBriefing({ date: '2026-10-02', force: true });

    expect(briefing).toBeDefined();
    expect(briefing.briefingDate).toBe('2026-10-02');
    expect(briefing.title).toContain('AI Radar Daily Briefing');
    expect(typeof briefing.summary).toBe('string');
    expect(briefing.summary.length).toBeGreaterThan(20);
  });
});
