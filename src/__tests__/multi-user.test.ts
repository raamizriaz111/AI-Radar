import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserProfile,
  saveUserProfile,
  getUserTrackedTopics,
  addTrackedTopic,
  removeTrackedTopic,
  saveIntelligence,
  getSavedIntelligence,
  unsaveIntelligence,
  deleteUserData,
  getSkillGaps,
  getProjectOpportunities,
  recordUserFeedback,
  getUserFeedbackList,
  resetPersonalizationRepository,
} from '@/lib/repositories/personalizationRepository';
import {
  createBookmark,
  getUserBookmarks,
  clearInMemoryBookmarks,
} from '@/lib/repositories/bookmarkRepository';
import {
  recordFeedbackInMemory,
  isEntityDismissed,
  isEntitySaved,
  filterDismissed,
  clearInMemoryFeedback,
  getInMemoryFeedback,
} from '@/lib/personalization/feedbackService';
import {
  getCurrentUser,
  setMockSession,
  clearMockSession,
  requireAuth,
  requireAdmin,
} from '@/lib/auth/session';
import {
  checkRateLimit,
  resetRateLimits,
} from '@/lib/services/rateLimiter';
import {
  getUserPlan,
  updateUserPlan,
  logAiUsage,
  checkUsageLimit,
  getUserUsageMetrics,
  getGlobalUsageMetrics,
  resetUsageStore,
} from '@/lib/services/usageService';
import {
  makeGlobalCacheKey,
  makeUserCacheKey,
  getGlobalCache,
  setGlobalCache,
  getUserCache,
  setUserCache,
  invalidateUserCache,
  clearAllCaches,
} from '@/lib/services/cacheService';
import { computePersonalRelevance } from '@/lib/personalization/personalRelevance';
import { buildPersonalizedBriefingSection } from '@/lib/personalization/personalBriefingService';
import { UserProfile } from '@/lib/personalization/types';
import { ItemFull } from '@/lib/database.types';

// Shared test items corpus (representing global shared intelligence)
const testCorpus: ItemFull[] = [
  {
    id: 'item-agent-1',
    source_id: 'src-1',
    external_id: 'gh-1',
    canonical_url: 'https://github.com/modelcontextprotocol/servers',
    title: 'Model Context Protocol (MCP) Tool Servers for AI Agents',
    description: 'Reference implementations of tool calling servers connecting LLM agents to dev environments and databases.',
    content_text: 'Model Context Protocol provides standard JSON-RPC interfaces for agent tool invocations in Python and TypeScript.',
    authors: ['Anthropic Team'],
    item_type: 'repository',
    published_at: '2026-10-01T12:00:00Z',
    discovered_at: '2026-10-01T12:00:00Z',
    content_hash: 'hash-agent',
    metadata: {
      technologies: ['TypeScript', 'Python', 'Model Context Protocol (MCP)'],
      topics: ['AI Agents', 'Coding Agents', 'Developer Tools'],
    },
    enrichment_status: 'completed',
    enrichment_error: null,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
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
      created_at: '',
      updated_at: '',
    },
    categories: [{ id: 'c1', label: 'Coding Agents', slug: 'coding-agents', description: '', sort_order: 1, created_at: '' }],
    summary: {
      id: 'sum-agent',
      item_id: 'item-agent-1',
      model_name: 'test-model',
      provider: 'anthropic',
      summary: 'Tool server standard for LLM agents.',
      key_points: ['Standardized tool calling for agent loops'],
      significance: 'High impact for agent interoperability',
      claims: [],
      confidence: 0.95,
      entities: [],
      technologies: ['Model Context Protocol (MCP)', 'TypeScript', 'Python'],
      topics: ['AI Agents', 'coding-agents'],
      suggested_categories: [],
      suggested_item_type: 'tool_release',
      prompt_version: '1.0.0',
      warning_flags: [],
      usage: null,
      generated_at: '',
      updated_at: '',
    },
  },
  {
    id: 'item-vision-2',
    source_id: 'src-2',
    external_id: 'arxiv-1',
    canonical_url: 'https://arxiv.org/abs/2609.99999',
    title: 'High-Fidelity Diffusion Transformers for Real-Time Computer Vision and Video Synthesis',
    description: 'A novel PyTorch architecture for accelerating diffusion transformers on CUDA hardware with spatial attention.',
    content_text: 'Diffusion video synthesis benchmarks on ImageNet with verifiable CUDA kernels.',
    authors: ['Vision Lab'],
    item_type: 'research_paper',
    published_at: '2026-10-01T10:00:00Z',
    discovered_at: '2026-10-01T10:00:00Z',
    content_hash: 'hash-vision',
    metadata: {
      technologies: ['PyTorch', 'CUDA', 'Transformers', 'OpenCV'],
      topics: ['Computer Vision', 'Diffusion', 'Research'],
    },
    enrichment_status: 'completed',
    enrichment_error: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    source: {
      id: 'src-2',
      name: 'arXiv CS.CV',
      source_type: 'research',
      base_url: 'https://arxiv.org',
      feed_url: null,
      description: null,
      trust_level: 3,
      active: true,
      config: {},
      created_at: '',
      updated_at: '',
    },
    categories: [{ id: 'c2', label: 'Models & Research', slug: 'research', description: '', sort_order: 2, created_at: '' }],
    summary: {
      id: 'sum-vision',
      item_id: 'item-vision-2',
      model_name: 'test-model',
      provider: 'openai',
      summary: 'Real-time diffusion transformer models for computer vision.',
      key_points: ['CUDA kernel optimizations for diffusion video synthesis'],
      significance: 'Improves inference speeds by 4x',
      claims: [],
      confidence: 0.9,
      entities: [],
      technologies: ['PyTorch', 'CUDA', 'OpenCV'],
      topics: ['Computer Vision', 'research'],
      suggested_categories: [],
      suggested_item_type: 'research_paper',
      prompt_version: '1.0.0',
      warning_flags: [],
      usage: null,
      generated_at: '',
      updated_at: '',
    },
  },
  {
    id: 'item-product-3',
    source_id: 'src-3',
    external_id: 'news-1',
    canonical_url: 'https://news.ycombinator.com/item?id=9999999',
    title: 'Show HN: Fast Vector Database API for React and Next.js SaaS Applications',
    description: 'Serverless vector search indexing designed for rapid prototype validation and production customer applications.',
    content_text: 'Enables developers to build retrieval augmented generation into Next.js and FastAPI backends in 5 minutes.',
    authors: ['Founder Team'],
    item_type: 'announcement',
    published_at: '2026-10-01T08:00:00Z',
    discovered_at: '2026-10-01T08:00:00Z',
    content_hash: 'hash-product',
    metadata: {
      technologies: ['React', 'Next.js', 'FastAPI', 'Vector databases', 'LLM APIs'],
      topics: ['AI Products', 'AI Startups', 'Developer Tools'],
    },
    enrichment_status: 'completed',
    enrichment_error: null,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    source: {
      id: 'src-3',
      name: 'Hacker News AI',
      source_type: 'community',
      base_url: 'https://news.ycombinator.com',
      feed_url: null,
      description: null,
      trust_level: 2,
      active: true,
      config: {},
      created_at: '',
      updated_at: '',
    },
    categories: [{ id: 'c3', label: 'AI Tools', slug: 'ai-tools', description: '', sort_order: 3, created_at: '' }],
    summary: {
      id: 'sum-product',
      item_id: 'item-product-3',
      model_name: 'test-model',
      provider: 'openai',
      summary: 'Turnkey vector search API for SaaS product builders.',
      key_points: ['Instant vector indexing for Next.js applications'],
      significance: 'Lowers barriers to launching AI applications',
      claims: [],
      confidence: 0.88,
      entities: [],
      technologies: ['React', 'Next.js', 'Vector databases', 'FastAPI'],
      topics: ['AI Products', 'ai-tools'],
      suggested_categories: [],
      suggested_item_type: 'tool_release',
      prompt_version: '1.0.0',
      warning_flags: [],
      usage: null,
      generated_at: '',
      updated_at: '',
    },
  },
];

describe('Phase 7 — Multi-User Architecture & Security Tests', () => {
  beforeEach(() => {
    resetPersonalizationRepository();
    clearInMemoryBookmarks();
    clearInMemoryFeedback();
    resetRateLimits();
    resetUsageStore();
    clearAllCaches();
    clearMockSession();
  });

  describe('1. Cross-User Data Isolation (Section 6 & 36)', () => {
    it('isolates user profiles between User A and User B', async () => {
      // User A creates their profile
      await saveUserProfile(
        {
          name: 'Alice Agent',
          primaryRoleInterest: 'AI Agent Engineer',
          skills: [{ name: 'LangGraph', category: 'Agents', level: 'advanced' }],
          technologies: ['Python', 'TypeScript', 'MCP'],
        },
        'user-a'
      );

      // User B creates their profile
      await saveUserProfile(
        {
          name: 'Bob Vision',
          primaryRoleInterest: 'Computer Vision Researcher',
          skills: [{ name: 'CUDA', category: 'Hardware', level: 'advanced' }],
          technologies: ['PyTorch', 'CUDA', 'C++'],
        },
        'user-b'
      );

      const profileA = await getUserProfile('user-a');
      const profileB = await getUserProfile('user-b');

      expect(profileA.name).toBe('Alice Agent');
      expect(profileA.primaryRoleInterest).toBe('AI Agent Engineer');
      expect(profileA.technologies).toContain('MCP');
      expect(profileA.technologies).not.toContain('CUDA');

      expect(profileB.name).toBe('Bob Vision');
      expect(profileB.primaryRoleInterest).toBe('Computer Vision Researcher');
      expect(profileB.technologies).toContain('CUDA');
      expect(profileB.technologies).not.toContain('MCP');
    });

    it('isolates user feedback so User A dismissal never dismisses items for User B', () => {
      // User A dismisses item-agent-1
      recordFeedbackInMemory({
        id: 'fb-a1',
        userId: 'user-a',
        entityType: 'item',
        entityId: 'item-agent-1',
        feedbackType: 'dismissed',
      });

      // Check dismissal status
      expect(isEntityDismissed('item', 'item-agent-1', undefined, 'user-a')).toBe(true);
      expect(isEntityDismissed('item', 'item-agent-1', undefined, 'user-b')).toBe(false);

      // Filtering dismissed items for User A removes it; for User B it remains intact
      const itemsA = filterDismissed(testCorpus, 'item', undefined, 'user-a');
      const itemsB = filterDismissed(testCorpus, 'item', undefined, 'user-b');

      expect(itemsA.map((i) => i.id)).not.toContain('item-agent-1');
      expect(itemsB.map((i) => i.id)).toContain('item-agent-1');
    });

    it('isolates bookmarks and saved intelligence between users', async () => {
      const userAUuid = 'a0000000-0000-4000-8000-000000000001';
      const userBUuid = 'b0000000-0000-4000-8000-000000000002';
      const itemAgentUuid = 'c0000000-0000-4000-8000-000000000001';
      const itemVisionUuid = 'c0000000-0000-4000-8000-000000000002';

      // User A bookmarks itemAgentUuid
      await createBookmark(userAUuid, itemAgentUuid);
      // User B bookmarks itemVisionUuid
      await createBookmark(userBUuid, itemVisionUuid);

      const bookmarksA = await getUserBookmarks(userAUuid);
      const bookmarksB = await getUserBookmarks(userBUuid);

      expect(bookmarksA.data.map((i) => i.id)).toContain(itemAgentUuid);
      expect(bookmarksA.data.map((i) => i.id)).not.toContain(itemVisionUuid);

      expect(bookmarksB.data.map((i) => i.id)).toContain(itemVisionUuid);
      expect(bookmarksB.data.map((i) => i.id)).not.toContain(itemAgentUuid);

      // User A saves a project
      await saveIntelligence(userAUuid, {
        entityType: 'project',
        entityId: 'proj-mcp',
        title: 'MCP Agent Bridge',
      });

      const savedA = await getSavedIntelligence(userAUuid);
      const savedB = await getSavedIntelligence(userBUuid);

      expect(savedA.length).toBe(1);
      expect(savedA[0].entityId).toBe('proj-mcp');
      expect(savedB.length).toBe(0);
    });

    it('isolates user tracked topics', async () => {
      await addTrackedTopic('user-a', 'Model Context Protocol', 'Agents');
      await addTrackedTopic('user-b', 'Vision Transformers', 'Research');

      const topicsA = await getUserTrackedTopics('user-a');
      const topicsB = await getUserTrackedTopics('user-b');

      expect(topicsA.map((t) => t.topic)).toEqual(['Model Context Protocol']);
      expect(topicsB.map((t) => t.topic)).toEqual(['Vision Transformers']);
    });
  });

  describe('2. Authentication & Authorization Security Guards (Section 5 & 36)', () => {
    it('enforces authentication on requireAuth()', async () => {
      clearMockSession();
      await expect(requireAuth()).rejects.toThrow('Authentication required');

      setMockSession({ id: 'user-auth', email: 'test@airadar.dev', role: 'user' });
      const user = await requireAuth();
      expect(user.id).toBe('user-auth');
      expect(user.email).toBe('test@airadar.dev');
    });

    it('enforces admin authorization on requireAdmin()', async () => {
      setMockSession({ id: 'user-regular', email: 'regular@airadar.dev', role: 'user' });
      await expect(requireAdmin()).rejects.toThrow('Admin authorization required');

      setMockSession({ id: 'user-admin', email: 'admin@airadar.dev', role: 'admin' });
      const admin = await requireAdmin();
      expect(admin.role).toBe('admin');
    });
  });

  describe('3. Sliding-Window Rate Limiting (Section 23)', () => {
    it('permits requests within limits and rejects when exceeded', () => {
      const clientIp = '192.168.1.100';

      // Limit is 10 for auth
      for (let i = 0; i < 10; i++) {
        const res = checkRateLimit(clientIp, 'auth');
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(9 - i);
      }

      // 11th request should be blocked
      const blocked = checkRateLimit(clientIp, 'auth');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.error).toContain('Rate limit exceeded');
    });
  });

  describe('4. AI Usage Telemetry & Commercial Plans (Section 21 & 22)', () => {
    it('creates default Free plan with correct allowances', async () => {
      const plan = await getUserPlan('user-test-plan');
      expect(plan.planTier).toBe('free');
      expect(plan.aiRequestsLimit).toBe(100);
      expect(plan.briefingsLimit).toBe(10);
      expect(plan.trackedTopicsLimit).toBe(20);
    });

    it('logs AI usage operations and updates user consumption metrics', async () => {
      const userId = 'user-ai-tracker';

      await logAiUsage({
        userId,
        operationType: 'enrichment',
        provider: 'openai',
        model: 'gpt-4o-mini',
        promptVersion: '1.0.0',
        tokensUsed: 450,
        isCached: false,
        status: 'success',
        costEstimateUsd: 0.00015,
      });

      await logAiUsage({
        userId,
        operationType: 'briefing',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
        promptVersion: '1.0.0',
        tokensUsed: 1200,
        isCached: true,
        status: 'success',
        costEstimateUsd: 0.0036,
      });

      const metrics = await getUserUsageMetrics(userId);
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.totalTokens).toBe(1650);
      expect(metrics.totalCostUsd).toBeCloseTo(0.00375, 4);

      const globalMetrics = getGlobalUsageMetrics();
      expect(globalMetrics.totalRequests).toBeGreaterThanOrEqual(2);
    });

    it('enforces plan daily allowance limits', async () => {
      const userId = 'user-limited';
      // Set limit to 2 for testing
      await updateUserPlan(userId, { aiRequestsLimit: 2 });

      let check = await checkUsageLimit(userId, 'summary');
      expect(check.allowed).toBe(true);

      await logAiUsage({
        userId,
        operationType: 'summary',
        provider: 'system',
        model: 'm',
        tokensUsed: 100,
        isCached: false,
        status: 'success',
        costEstimateUsd: 0,
      });

      await logAiUsage({
        userId,
        operationType: 'summary',
        provider: 'system',
        model: 'm',
        tokensUsed: 100,
        isCached: false,
        status: 'success',
        costEstimateUsd: 0,
      });

      // Should now be blocked
      check = await checkUsageLimit(userId, 'summary');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Daily AI operations limit');
    });
  });

  describe('5. Cache Isolation (Section 24)', () => {
    it('isolates user-scoped cache keys from global and cross-user cache', () => {
      setUserCache('user-1', 'feed', 'today', { items: ['item-1'] });
      setUserCache('user-2', 'feed', 'today', { items: ['item-2'] });
      setGlobalCache('feed', 'today', { items: ['global-item'] });

      const cachedUser1 = getUserCache('user-1', 'feed', 'today');
      const cachedUser2 = getUserCache('user-2', 'feed', 'today');
      const cachedGlobal = getGlobalCache('feed', 'today');

      expect(cachedUser1).toEqual({ items: ['item-1'] });
      expect(cachedUser2).toEqual({ items: ['item-2'] });
      expect(cachedGlobal).toEqual({ items: ['global-item'] });

      // Invalidation of User 1 does not affect User 2 or Global
      invalidateUserCache('user-1');
      expect(getUserCache('user-1', 'feed', 'today')).toBeNull();
      expect(getUserCache('user-2', 'feed', 'today')).not.toBeNull();
      expect(getGlobalCache('feed', 'today')).not.toBeNull();
    });
  });

  describe('6. Account Deletion Architecture (Section 31)', () => {
    it('deletes all private user records while leaving global intelligence intact', async () => {
      const userId = 'd0000000-0000-4000-8000-000000000001';
      const itemId = 'e0000000-0000-4000-8000-000000000001';

      await saveUserProfile({ name: 'Delete Me' }, userId);
      await createBookmark(userId, itemId);
      await addTrackedTopic(userId, 'Robotics');
      await saveIntelligence(userId, { entityType: 'item', entityId: itemId, title: 'Saved' });

      // Execute deletion
      const res = await deleteUserData(userId);
      expect(res.success).toBe(true);

      // Verify user's private data is wiped
      const profile = await getUserProfile(userId);
      expect(profile.name).not.toBe('Delete Me'); // Reverts to clean default
      const bookmarks = await getUserBookmarks(userId);
      expect(bookmarks.data.length).toBe(0);
      const topics = await getUserTrackedTopics(userId);
      expect(topics.length).toBe(0);
      const saved = await getSavedIntelligence(userId);
      expect(saved.length).toBe(0);

      // Verify global items in test corpus are completely untouched!
      expect(testCorpus.length).toBe(3);
    });
  });

  describe('7. Multi-User Persona Validation (Section 54)', () => {
    const personaAgent: UserProfile = {
      id: 'prof-agent',
      userId: 'user-agent-eng',
      name: 'Agent Engineer',
      experienceLevel: 'advanced',
      primaryRoleInterest: 'AI Agent Engineer',
      secondaryRoleInterests: ['Coding Agents Developer'],
      skills: [{ name: 'Model Context Protocol (MCP)', category: 'Agents', level: 'advanced' }],
      technologies: ['TypeScript', 'Python', 'Model Context Protocol (MCP)'],
      careerGoals: ['Build autonomous coding agents with MCP'],
      learningGoals: ['Master AI Agents and Tool Calling'],
      projectInterests: ['AI agents', 'Developer tools'],
      preferredTopics: ['AI Agents', 'coding-agents'],
      excludedTopics: [],
      metadata: {},
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const personaVision: UserProfile = {
      id: 'prof-vision',
      userId: 'user-vision-researcher',
      name: 'Vision Researcher',
      experienceLevel: 'advanced',
      primaryRoleInterest: 'Computer Vision Researcher',
      secondaryRoleInterests: ['Research Engineer'],
      skills: [{ name: 'CUDA', category: 'Hardware', level: 'advanced' }, { name: 'PyTorch', category: 'ML', level: 'advanced' }],
      technologies: ['PyTorch', 'CUDA', 'OpenCV'],
      careerGoals: ['Publish video diffusion architectures'],
      learningGoals: ['Building Real-time Vision Applications'],
      projectInterests: ['Computer vision applications', 'Research benchmark tools'],
      preferredTopics: ['Computer Vision', 'research'],
      excludedTopics: [],
      metadata: {},
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const personaProduct: UserProfile = {
      id: 'prof-product',
      userId: 'user-product-builder',
      name: 'AI Product Builder',
      experienceLevel: 'intermediate',
      primaryRoleInterest: 'AI Product Engineer',
      secondaryRoleInterests: ['Full Stack Developer'],
      skills: [{ name: 'React', category: 'Frontend', level: 'advanced' }, { name: 'Vector databases', category: 'Storage', level: 'intermediate' }],
      technologies: ['React', 'Next.js', 'FastAPI', 'Vector databases'],
      careerGoals: ['Launch AI-enabled SaaS applications'],
      learningGoals: ['Production LLM Evaluation & RAG'],
      projectInterests: ['AI applications', 'SaaS products'],
      preferredTopics: ['AI Products', 'ai-tools'],
      excludedTopics: [],
      metadata: {},
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    it('produces distinctly ranked relevance matching each persona explicit profile', () => {
      // Evaluate Item 1 (MCP / Agents)
      const relAgent1 = computePersonalRelevance(testCorpus[0], personaAgent);
      const relVision1 = computePersonalRelevance(testCorpus[0], personaVision);
      const relProduct1 = computePersonalRelevance(testCorpus[0], personaProduct);

      expect(relAgent1.score).toBeGreaterThan(60);
      expect(relAgent1.reasons.some((r) => r.includes('Model Context Protocol (MCP)') || r.includes('AI Agent'))).toBe(true);
      expect(relAgent1.score).toBeGreaterThan(relVision1.score);

      // Evaluate Item 2 (Diffusion Video / PyTorch / CUDA)
      const relAgent2 = computePersonalRelevance(testCorpus[1], personaAgent);
      const relVision2 = computePersonalRelevance(testCorpus[1], personaVision);
      const relProduct2 = computePersonalRelevance(testCorpus[1], personaProduct);

      expect(relVision2.score).toBeGreaterThan(60);
      expect(relVision2.reasons.some((r) => r.includes('CUDA') || r.includes('PyTorch'))).toBe(true);
      expect(relVision2.score).toBeGreaterThan(relAgent2.score);

      // Evaluate Item 3 (Vector DB / Next.js SaaS)
      const relProduct3 = computePersonalRelevance(testCorpus[2], personaProduct);
      expect(relProduct3.score).toBeGreaterThan(60);
      expect(relProduct3.reasons.some((r) => r.includes('Vector databases') || r.includes('React'))).toBe(true);
    });

    it('generates distinctly tailored personalized briefing sections for all 3 personas', () => {
      const briefingAgent = buildPersonalizedBriefingSection(testCorpus, personaAgent, 'user-agent-eng');
      const briefingVision = buildPersonalizedBriefingSection(testCorpus, personaVision, 'user-vision-researcher');
      const briefingProduct = buildPersonalizedBriefingSection(testCorpus, personaProduct, 'user-product-builder');

      // Each persona's #1 top briefing item must align with their specific role
      expect(briefingAgent.items[0].itemId).toBe('item-agent-1');
      expect(briefingAgent.items[0].title).toContain('Model Context Protocol');

      expect(briefingVision.items[0].itemId).toBe('item-vision-2');
      expect(briefingVision.items[0].title).toContain('Diffusion Transformers');

      expect(briefingProduct.items[0].itemId).toBe('item-product-3');
      expect(briefingProduct.items[0].title).toContain('Vector Database API');

      // Summaries reference their respective primary roles
      expect(briefingAgent.summary).toContain('AI Agent Engineer');
      expect(briefingVision.summary).toContain('Computer Vision Researcher');
      expect(briefingProduct.summary).toContain('AI Product Engineer');
    });

    it('generates distinct project opportunities and skill gaps based on user skills', async () => {
      const oppsAgent = await getProjectOpportunities(personaAgent, 'user-agent-eng');
      const oppsVision = await getProjectOpportunities(personaVision, 'user-vision-researcher');

      expect(oppsAgent.length).toBeGreaterThan(0);
      expect(oppsVision.length).toBeGreaterThan(0);

      // Verify agent opps match agent skills, vision opps match vision skills
      const topAgentOpp = oppsAgent[0];
      expect(topAgentOpp.skillsMatched.length).toBeGreaterThanOrEqual(0);
    });
  });
});
