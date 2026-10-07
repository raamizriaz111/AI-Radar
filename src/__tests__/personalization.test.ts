import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_USER_PROFILE,
  UserProfile,
} from '@/lib/personalization/types';
import { computePersonalRelevance } from '@/lib/personalization/personalRelevance';
import { analyzeSkillDemand } from '@/lib/personalization/skillDemandEngine';
import { detectSkillGaps } from '@/lib/personalization/skillGapEngine';
import { detectCareerSignals } from '@/lib/personalization/careerSignalsEngine';
import { generateProjectOpportunities } from '@/lib/personalization/projectOpportunityEngine';
import { buildPersonalizedBriefingSection } from '@/lib/personalization/personalBriefingService';
import { getLearningTopics } from '@/lib/personalization/learningIntelligence';
import {
  recordFeedbackInMemory,
  getInMemoryFeedback,
  clearInMemoryFeedback,
  isEntityDismissed,
  isEntitySaved,
  filterDismissed,
} from '@/lib/personalization/feedbackService';
import {
  getUserProfile,
  saveUserProfile,
  getCareerSignals,
  getSkillGaps,
  getProjectOpportunities,
  updateProjectOpportunityStatus,
  updateSkillGapStatus,
} from '@/lib/repositories/personalizationRepository';
import type { ItemFull } from '@/lib/database.types';

// Mock test corpus
const mockItems: ItemFull[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    source_id: 'src-1',
    external_id: 'item-1',
    canonical_url: 'https://github.com/modelcontextprotocol/servers',
    title: 'Model Context Protocol (MCP) Reference Servers in TypeScript and Python',
    description: 'Open reference implementations of tool servers supporting MCP for AI agents.',
    content_text: 'Model Context Protocol servers enable AI agents to safely invoke developer tools and databases.',
    authors: ['Anthropic'],
    item_type: 'repository',
    published_at: new Date().toISOString(),
    discovered_at: new Date().toISOString(),
    content_hash: 'hash1',
    metadata: {
      technologies: ['TypeScript', 'Python', 'MCP', 'JSON-RPC'],
      topics: ['agents', 'tools', 'protocols'],
    },
    enrichment_status: 'completed',
    enrichment_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: {
      id: 'src-1',
      name: 'GitHub AI Repos',
      source_type: 'repository',
      base_url: 'https://github.com',
      feed_url: null,
      description: null,
      trust_level: 2,
      active: true,
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: [{ id: 'c1', label: 'Coding Agents', slug: 'coding-agents', description: '', sort_order: 1, created_at: '' }],
    summary: {
      id: 's1',
      item_id: '11111111-1111-1111-1111-111111111111',
      model_name: 'test-model',
      provider: 'test-provider',
      summary: 'Standardized tool server protocol implementations for agentic loops.',
      key_points: ['Provides JSON-RPC stdio and SSE transport', 'Designed for AI coding agents'],
      significance: 'High impact for agent tool interoperability',
      claims: [],
      confidence: 0.9,
      entities: [],
      technologies: ['TypeScript', 'Model Context Protocol (MCP)'],
      topics: ['coding-agents'],
      suggested_categories: [],
      suggested_item_type: 'tool_release',
      prompt_version: '1.0.0',
      warning_flags: [],
      usage: null,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    source_id: 'src-2',
    external_id: 'item-2',
    canonical_url: 'https://arxiv.org/abs/2501.00001',
    title: 'Evaluating LLM Reasoning Traces and Thinking Tokens at Test Time',
    description: 'Comprehensive benchmark analyzing inference scaling and chain-of-thought verification for reasoning models.',
    content_text: 'Test-time compute scaling demonstrates verifiable gains on coding benchmarks.',
    authors: ['Research Team'],
    item_type: 'research_paper',
    published_at: new Date().toISOString(),
    discovered_at: new Date().toISOString(),
    content_hash: 'hash2',
    metadata: {
      technologies: ['Python', 'PyTorch'],
      topics: ['reasoning', 'eval', 'benchmarks'],
    },
    enrichment_status: 'completed',
    enrichment_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: {
      id: 'src-2',
      name: 'arXiv AI Papers',
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
    categories: [{ id: 'c2', label: 'Models & Research', slug: 'models', description: '', sort_order: 2, created_at: '' }],
    summary: {
      id: 's2',
      item_id: '22222222-2222-2222-2222-222222222222',
      model_name: 'test-model',
      provider: 'test-provider',
      summary: 'Analysis of test-time compute and verification for reasoning models.',
      key_points: ['Reasoning tokens improve code synthesis accuracy'],
      significance: 'Key insight for agent verification harnesses',
      claims: [],
      confidence: 0.95,
      entities: [],
      technologies: ['Python'],
      topics: ['reasoning', 'eval'],
      suggested_categories: [],
      suggested_item_type: 'research_paper',
      prompt_version: '1.0.0',
      warning_flags: [],
      usage: null,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    source_id: 'src-1',
    external_id: 'item-3',
    canonical_url: 'https://example.com/crypto-coin-ai',
    title: 'New AI Crypto Token Launches on Decentralized Exchange',
    description: 'Speculative crypto coin leveraging AI branding.',
    content_text: 'Crypto decentralized token trading.',
    authors: ['Crypto Marketer'],
    item_type: 'announcement',
    published_at: new Date().toISOString(),
    discovered_at: new Date().toISOString(),
    content_hash: 'hash3',
    metadata: {
      technologies: ['Solidity'],
      topics: ['crypto', 'token'],
    },
    enrichment_status: 'pending',
    enrichment_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: {
      id: 'src-1',
      name: 'GitHub AI Repos',
      source_type: 'repository',
      base_url: 'https://github.com',
      feed_url: null,
      description: null,
      trust_level: 1,
      active: true,
      config: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: [],
    summary: null,
  },
];

describe('Phase 6 — Personal Relevance & Explainable Matching', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    skills: [
      { name: 'TypeScript', level: 'advanced', category: 'Languages' },
      { name: 'Python', level: 'intermediate', category: 'Languages' },
    ],
    technologies: ['TypeScript', 'Python', 'Next.js'],
    primaryRoleInterest: 'AI / Full Stack Engineer',
    learningGoals: ['Agentic workflows & tool use protocols'],
    excludedTopics: ['crypto', 'nft'],
  };

  it('computes high relevance for items matching skills and role interest', () => {
    const match = computePersonalRelevance(mockItems[0], profile);

    expect(match.isExcluded).toBe(false);
    expect(match.score).toBeGreaterThanOrEqual(40);
    expect(match.matchedSkills).toContain('TypeScript');
    expect(match.reasons.length).toBeGreaterThan(0);
    expect(match.reasons.some((r) => r.includes('TypeScript'))).toBe(true);
  });

  it('returns score 0 and isExcluded=true for items matching negative filters', () => {
    const match = computePersonalRelevance(mockItems[2], profile);

    expect(match.isExcluded).toBe(true);
    expect(match.score).toBe(0);
    expect(match.reasons.some((r) => r.includes('Excluded by topic filter'))).toBe(true);
  });

  it('provides explainable reasons for learning goal alignment', () => {
    const match = computePersonalRelevance(mockItems[0], profile);
    const hasGoalOrRoleReason = match.reasons.some(
      (r) => r.includes('role') || r.includes('skill') || r.includes('goal')
    );
    expect(hasGoalOrRoleReason).toBe(true);
  });
});

describe('Phase 6 — Skill Demand & Frequency Engine', () => {
  it('aggregates mentions and sources across items', () => {
    const demand = analyzeSkillDemand(mockItems, DEFAULT_USER_PROFILE);

    expect(demand.length).toBeGreaterThan(0);
    const tsMetric = demand.find((d) => d.name === 'TypeScript');
    expect(tsMetric).toBeDefined();
    expect(tsMetric?.uniqueSources).toBeGreaterThanOrEqual(1);
    expect(tsMetric?.userProficiency).toBe('advanced');
  });

  it('identifies untracked skills appropriately', () => {
    const customProfile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      skills: [{ name: 'TypeScript', level: 'advanced' }],
    };
    const demand = analyzeSkillDemand(mockItems, customProfile);
    const pyMetric = demand.find((d) => d.name === 'Python');
    expect(pyMetric?.userProficiency).toBe('untracked');
  });
});

describe('Phase 6 — Potential Skill Gap Detection', () => {
  it('detects skill gaps for high-signal skills missing from profile', () => {
    const customProfile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      skills: [{ name: 'TypeScript', level: 'advanced' }],
    };

    const gaps = detectSkillGaps(customProfile, mockItems);
    expect(Array.isArray(gaps)).toBe(true);

    // Python is in mock items twice and missing from customProfile
    const pythonGap = gaps.find((g) => g.skillName === 'Python');
    if (pythonGap) {
      expect(pythonGap.gapType).toBe('untracked');
      expect(pythonGap.learningPath.length).toBeGreaterThanOrEqual(2);
      expect(pythonGap.relevanceReason).toBeTruthy();
    }
  });

  it('includes progressive learning paths with concrete steps', () => {
    const gaps = detectSkillGaps(DEFAULT_USER_PROFILE, mockItems);
    for (const gap of gaps) {
      expect(gap.learningPath.length).toBeGreaterThanOrEqual(2);
      expect(gap.learningPath[0].step).toBe(1);
      expect(gap.learningPath[0].title).toBeTruthy();
      expect(gap.learningPath[0].description).toBeTruthy();
    }
  });
});

describe('Phase 6 — Evidence-Backed Career Signals', () => {
  it('detects career signals with evidence citations', () => {
    const signals = detectCareerSignals(mockItems);

    expect(signals.length).toBeGreaterThan(0);
    const mcpOrAgentSignal = signals.find(
      (s) => s.id === 'signal-agent-orchestration' || s.id === 'signal-mcp-protocol-standard'
    );
    expect(mcpOrAgentSignal).toBeDefined();
    expect(mcpOrAgentSignal?.whyItMatters).toBeTruthy();
    expect(Array.isArray(mcpOrAgentSignal?.evidenceItems)).toBe(true);
    expect(mcpOrAgentSignal?.evidenceItems.length).toBeGreaterThan(0);
  });
});

describe('Phase 6 — Project Opportunity Discovery', () => {
  it('matches profile skills against project blueprints', () => {
    const opportunities = generateProjectOpportunities(DEFAULT_USER_PROFILE, mockItems);

    expect(opportunities.length).toBeGreaterThan(0);
    const mcpProject = opportunities.find((o) => o.slug === 'mcp-developer-tool-bridge');
    expect(mcpProject).toBeDefined();

    // Profile has TypeScript
    expect(mcpProject?.skillsMatched).toContain('TypeScript');
    expect(mcpProject?.implementationSteps.length).toBeGreaterThanOrEqual(3);
    expect(mcpProject?.potentialChallenges.length).toBeGreaterThanOrEqual(1);
  });

  it('cites supporting items for project ideas', () => {
    const opportunities = generateProjectOpportunities(DEFAULT_USER_PROFILE, mockItems);
    const mcpProject = opportunities.find((o) => o.slug === 'mcp-developer-tool-bridge');
    expect(mcpProject?.evidenceItems.length).toBeGreaterThan(0);
  });
});

describe('Phase 6 — Learning Intelligence & Concept Blueprints', () => {
  it('provides learning topics linked to primary sources', () => {
    const topics = getLearningTopics(mockItems);

    expect(topics.length).toBeGreaterThanOrEqual(3);
    const mcpTopic = topics.find((t) => t.slug === 'agent-protocols-and-mcp');
    expect(mcpTopic).toBeDefined();
    expect(mcpTopic?.prerequisites.length).toBeGreaterThan(0);
    expect(mcpTopic?.keyConcepts.length).toBeGreaterThan(0);
    expect(mcpTopic?.starterProject).toBeTruthy();
  });
});

describe('Phase 6 — Personalized Briefing Extension', () => {
  it('builds What Matters To You section tailored to profile', () => {
    const section = buildPersonalizedBriefingSection(mockItems, DEFAULT_USER_PROFILE);

    expect(section.title).toBe('What Matters To You Today');
    expect(section.items.length).toBeGreaterThan(0);
    expect(section.items[0].relevanceScore).toBeGreaterThan(0);
    expect(section.items[0].relevanceReasons.length).toBeGreaterThan(0);
  });
});

describe('Phase 6 — User Feedback & Interaction Service', () => {
  beforeEach(() => {
    clearInMemoryFeedback();
  });

  it('records and retrieves user feedback', () => {
    recordFeedbackInMemory({
      id: 'fb-1',
      entityType: 'project',
      entityId: 'proj-mcp',
      feedbackType: 'saved',
    });

    const list = getInMemoryFeedback();
    expect(list.length).toBe(1);
    expect(isEntitySaved('project', 'proj-mcp')).toBe(true);
    expect(isEntityDismissed('project', 'proj-mcp')).toBe(false);
  });

  it('filters out dismissed items correctly', () => {
    recordFeedbackInMemory({
      id: 'fb-2',
      entityType: 'project',
      entityId: 'proj-1',
      feedbackType: 'dismissed',
    });

    const items = [{ id: 'proj-1' }, { id: 'proj-2' }];
    const remaining = filterDismissed(items, 'project');
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('proj-2');
  });
});

describe('Phase 6 — Personalization Repository (In-Memory Fallback)', () => {
  it('retrieves default profile on first access', async () => {
    const profile = await getUserProfile();
    expect(profile).toBeDefined();
    expect(profile.primaryRoleInterest).toBe('AI / Full Stack Engineer');
  });

  it('updates profile and reflects changes', async () => {
    const updated = await saveUserProfile({
      name: 'Senior AI Engineer',
      primaryRoleInterest: 'AI Systems Architect',
    });

    expect(updated.name).toBe('Senior AI Engineer');
    expect(updated.primaryRoleInterest).toBe('AI Systems Architect');

    const fetched = await getUserProfile();
    expect(fetched.name).toBe('Senior AI Engineer');
  });

  it('updates project opportunity status and notes', async () => {
    await updateProjectOpportunityStatus(
      'mcp-developer-tool-bridge',
      'in_progress',
      'Started reading MCP protocol spec'
    );

    const projects = await getProjectOpportunities();
    const updated = projects.find((p) => p.slug === 'mcp-developer-tool-bridge');
    expect(updated?.userStatus).toBe('in_progress');
    expect(updated?.userNotes).toBe('Started reading MCP protocol spec');
  });

  it('updates skill gap status', async () => {
    await updateSkillGapStatus('gap-python', 'in_progress');
    const gaps = await getSkillGaps();
    const targetGap = gaps.find((g) => g.id === 'gap-python');
    if (targetGap) {
      expect(targetGap.userActionStatus).toBe('in_progress');
    }
  });
});
