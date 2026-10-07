// =============================================================================
// AI Radar — Potential Skill Gap & Learning Pathway Engine
// =============================================================================
// Compares a user's stated skills against high-signal technologies from recent
// items and trends to detect practical skill gaps with actionable learning steps.
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { UserProfile, SkillGap, SkillGapType } from './types';
import { analyzeSkillDemand } from './skillDemandEngine';

/**
 * Standard templates for progressive learning pathways
 */
const LEARNING_PATH_TEMPLATES: Record<
  string,
  Array<{ step: number; title: string; description: string; resourceType?: string }>
> = {
  'Model Evaluation & Benchmarking': [
    { step: 1, title: 'Understand Evaluation Foundations', description: 'Study task-specific metrics vs LLM-as-a-judge approaches and benchmark leakage issues.', resourceType: 'paper' },
    { step: 2, title: 'Build a Deterministic Eval Harness', description: 'Implement an automated test runner asserting JSON schemas, latency, and exact token assertions.', resourceType: 'code' },
    { step: 3, title: 'Pairwise & ELO Comparison', description: 'Run automated side-by-side evaluations comparing local models against cloud APIs on custom test suites.', resourceType: 'project' },
  ],
  'Model Context Protocol (MCP)': [
    { step: 1, title: 'Core MCP Architecture', description: 'Learn the JSON-RPC message flow between client, server, and model runtime.', resourceType: 'documentation' },
    { step: 2, title: 'Build a Custom MCP Tool Server', description: 'Develop a small TypeScript or Python MCP server exposing local developer tools or databases.', resourceType: 'code' },
    { step: 3, title: 'Integrate MCP with Agent Orchestration', description: 'Connect your custom MCP tools to coding agents or terminal workflows with explicit capability controls.', resourceType: 'project' },
  ],
  'Autonomous Agents': [
    { step: 1, title: 'Agent Tool Calling & Loop Design', description: 'Understand how ReAct loops, tool execution errors, and retry limits work under the hood.', resourceType: 'documentation' },
    { step: 2, title: 'Deterministic State & History Pruning', description: 'Implement state machines to prevent context window overflow during multi-turn agent execution.', resourceType: 'code' },
    { step: 3, title: 'Multi-Agent Coordination & Safety', description: 'Build a multi-agent pipeline with a planning agent and verification supervisor.', resourceType: 'project' },
  ],
  'RAG Architectures': [
    { step: 1, title: 'Chunking & Embedding Optimization', description: 'Evaluate semantic vs fixed-size chunking and dense vs hybrid keyword retrieval on sample documents.', resourceType: 'paper' },
    { step: 2, title: 'Reranking & Context Compression', description: 'Add cross-encoder rerankers to improve top-k recall and discard noisy background context.', resourceType: 'code' },
    { step: 3, title: 'End-to-End Citation & Provenance', description: 'Implement strict source citation validation to verify that every answer claim references a retrieved chunk.', resourceType: 'project' },
  ],
  'Quantisation (GGUF / AWQ)': [
    { step: 1, title: 'Quantisation Theory & Tradeoffs', description: 'Understand weight-only vs activation quantisation (INT4, INT8, AWQ, GGUF) and perplexity degradation.', resourceType: 'paper' },
    { step: 2, title: 'Local Runtimes with Ollama & llama.cpp', description: 'Benchmark inference speed and VRAM consumption across different quantization presets on local hardware.', resourceType: 'code' },
    { step: 3, title: 'Hybrid Local/Cloud Fallback Service', description: 'Build a gateway that routes simple queries to local quantized models and difficult tasks to frontier models.', resourceType: 'project' },
  ],
  'Reasoning & Thinking Models': [
    { step: 1, title: 'Inference-Time Scaling Laws', description: 'Explore how reasoning tokens and chain-of-thought verification change model accuracy at test time.', resourceType: 'paper' },
    { step: 2, title: 'Prompting & Output Parsing for Reasoning Models', description: 'Structure prompts to isolate reasoning tags from final answers and enforce verifiable output schemas.', resourceType: 'code' },
    { step: 3, title: 'Verification Harness for Complex Reasoning', description: 'Build an automated solver harness that verifies math, coding, and logical reasoning steps.', resourceType: 'project' },
  ],
};

/**
 * Detects potential skill gaps given user's profile and collected intelligence items.
 */
export function detectSkillGaps(
  profile: UserProfile,
  items: ItemFull[],
  trends: Array<{ id: string; title: string; slug: string }> = []
): SkillGap[] {
  const demandMetrics = analyzeSkillDemand(items, profile);
  const gaps: SkillGap[] = [];

  for (const metric of demandMetrics) {
    // Only consider skills with meaningful evidence (at least 2 appearances)
    if (metric.frequency < 2) continue;

    // Check if user already has this skill at advanced level
    const existingSkill = profile.skills.find(
      (s) => s.name.toLowerCase() === metric.name.toLowerCase()
    );

    let gapType: SkillGapType | null = null;
    let relevanceReason = '';

    if (!existingSkill) {
      // Untracked skill that has high demand in ecosystem
      gapType = 'untracked';
      relevanceReason = `Identified across ${metric.frequency} recent updates from ${metric.uniqueSources} sources. Not currently listed in your active skills profile.`;
    } else if (existingSkill.level === 'beginner' || existingSkill.level === 'interested') {
      // Level-up opportunity
      gapType = 'level_up';
      relevanceReason = `You have marked "${metric.name}" as ${existingSkill.level}, but it has surfaced in ${metric.frequency} recent developments relevant to your target role (${profile.primaryRoleInterest}).`;
    } else if (metric.status === 'surging' && existingSkill.level === 'intermediate') {
      gapType = 'emerging';
      relevanceReason = `Surging across multiple independent sources. Deepening mastery could strengthen your ${profile.primaryRoleInterest} workflow.`;
    }

    if (!gapType) continue;

    // Find supporting items from the items corpus
    const supportingItems = items
      .filter((item) => {
        const text = `${item.title} ${item.description || ''}`.toLowerCase();
        return text.includes(metric.name.toLowerCase()) || metric.recentItemTitles.includes(item.title);
      })
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.canonical_url,
      }));

    // Find supporting trends
    const supportingTrends = trends
      .filter((t) => t.title.toLowerCase().includes(metric.name.toLowerCase()) || t.slug.includes(metric.name.toLowerCase()))
      .slice(0, 2);

    // Get or construct a learning path
    const learningPath =
      LEARNING_PATH_TEMPLATES[metric.name] || [
        {
          step: 1,
          title: `Foundations of ${metric.name}`,
          description: `Review official documentation and core principles of ${metric.name}.`,
          resourceType: 'documentation',
        },
        {
          step: 2,
          title: `Hands-on Integration`,
          description: `Build a minimal prototype using ${metric.name} in a test environment.`,
          resourceType: 'code',
        },
        {
          step: 3,
          title: `Real-world Project Implementation`,
          description: `Incorporate ${metric.name} into your active project stack with automated verification.`,
          resourceType: 'project',
        },
      ];

    gaps.push({
      id: `gap-${metric.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      userId: profile.userId,
      skillName: metric.name,
      skillCategory: metric.category,
      relevanceReason,
      gapType,
      targetRole: profile.primaryRoleInterest,
      associatedTechnologies: [metric.name],
      supportingItems,
      supportingTrends,
      learningPath,
      userActionStatus: 'active',
      metadata: {
        frequency: metric.frequency,
        status: metric.status,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Limit to top 6 most actionable gaps to avoid cognitive overload
    if (gaps.length >= 6) break;
  }

  return gaps;
}
