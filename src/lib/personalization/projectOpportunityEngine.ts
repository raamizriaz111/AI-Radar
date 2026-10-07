// =============================================================================
// AI Radar — Project Opportunity & "What Could I Build?" Engine
// =============================================================================
// Formulates evidence-grounded project ideas addressing real engineering
// challenges, matched against the user's skills profile.
//
// Rules:
// - Never claim guaranteed business profitability or market sizes.
// - Always separate observed developer problems from proposed solutions.
// - Compare required skills against user's profile to highlight matched vs gap skills.
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { UserProfile, ProjectOpportunity, ProjectOpportunityDifficulty } from './types';

interface ProjectBlueprint {
  slug: string;
  title: string;
  problemStatement: string;
  targetUser: string;
  proposedSolution: string;
  whyNow: string;
  difficulty: ProjectOpportunityDifficulty;
  technicalStack: string[];
  requiredSkills: string[];
  implementationSteps: Array<{ step: number; title: string; detail: string }>;
  potentialChallenges: string[];
  keywords: string[];
  relatedTrendSlugs: string[];
}

const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  {
    slug: 'mcp-developer-tool-bridge',
    title: 'Custom Model Context Protocol (MCP) Bridge for Local Development',
    problemStatement:
      'AI coding assistants and autonomous agents often lack safe, controlled access to internal databases, local debug logs, and specialized developer utilities.',
    targetUser: 'Software engineers using modern AI coding assistants and agent frameworks.',
    proposedSolution:
      'Build a modular TypeScript MCP server that safely exposes authorized developer commands, database inspection schemas, and local log parsers via the standardized JSON-RPC protocol.',
    whyNow:
      'The Model Context Protocol has emerged as an open standard supported across multiple major coding agents, making modular tool bridges immediately useful across tools.',
    difficulty: 'medium',
    technicalStack: ['TypeScript', 'Node.js', 'Model Context Protocol (MCP)', 'Zod'],
    requiredSkills: ['TypeScript', 'Model Context Protocol (MCP)', 'Tool Calling', 'Security Sandboxing'],
    implementationSteps: [
      { step: 1, title: 'Protocol Initialization', detail: 'Implement stdio and SSE transport handlers using the official MCP TypeScript SDK.' },
      { step: 2, title: 'Schema & Tool Definition', detail: 'Define strictly validated tool schemas with Zod for query execution and log inspection.' },
      { step: 3, title: 'Capability & Permission Guards', detail: 'Implement read-only mode flags and explicit user confirmation for write operations.' },
      { step: 4, title: 'Agent Integration & Testing', detail: 'Connect and test the server with popular coding agents and evaluate error handling.' },
    ],
    potentialChallenges: [
      'Ensuring strict read-only constraints so agents cannot execute destructive local commands.',
      'Handling stream latency and graceful process shutdown across operating systems.',
    ],
    keywords: ['mcp', 'protocol', 'agent', 'tool', 'developer'],
    relatedTrendSlugs: ['agentic-workflows-and-tool-use-protocols'],
  },
  {
    slug: 'deterministic-rag-citation-auditor',
    title: 'Deterministic Citation & Provenance Validator for RAG Systems',
    problemStatement:
      'Retrieval-Augmented Generation (RAG) systems frequently generate claims with hallucinated or misattributed citations, causing trust breakdowns in research and enterprise search.',
    targetUser: 'Engineering teams building technical documentation search, research tools, or compliance assistants.',
    proposedSolution:
      'Create an automated verification middleware that scans generated responses, maps each factual claim back to retrieved source text using n-gram overlap and semantic entailment, and flags unsupported statements.',
    whyNow:
      'As teams deploy RAG beyond prototypes, verifiable grounding and auditability are required before production release.',
    difficulty: 'medium',
    technicalStack: ['Python or TypeScript', 'FastAPI', 'Embedding Models', 'Vitest'],
    requiredSkills: ['RAG Architecture', 'Model Evaluation', 'Prompt Engineering', 'TypeScript'],
    implementationSteps: [
      { step: 1, title: 'Claim Extraction', detail: 'Extract atomic factual claims from generated AI responses using structured parsing.' },
      { step: 2, title: 'Span Alignment & Verification', detail: 'Compute token overlap and semantic similarity against retrieved document chunks.' },
      { step: 3, title: 'Confidence Scoring & Flagging', detail: 'Output confidence scores (high, medium, unverified) and highlight unsupported sentences.' },
      { step: 4, title: 'Interactive Audit UI', detail: 'Build a lightweight dashboard visualizing claims side-by-side with supporting evidence.' },
    ],
    potentialChallenges: [
      'Balancing strict alignment checks against paraphrasing where meaning is preserved but tokens differ.',
      'Maintaining low latency in real-time streaming RAG pipelines.',
    ],
    keywords: ['rag', 'retrieval', 'eval', 'citation', 'benchmark'],
    relatedTrendSlugs: ['rag-architectures-and-evaluation'],
  },
  {
    slug: 'hybrid-model-inference-router',
    title: 'Cost-Optimized Hybrid Inference Router & Fallback Gateway',
    problemStatement:
      'Developers spend excessive budgets routing routine formatting, classification, and summarization queries to frontier cloud models, while purely local models struggle on hard reasoning.',
    targetUser: 'Indie hackers, startups, and developers running multi-tenant AI applications.',
    proposedSolution:
      'Develop an intelligent API proxy gateway that classifies prompt complexity: routing routine queries to local quantized models (Ollama/vLLM) and escalating high-complexity prompts to cloud APIs.',
    whyNow:
      'High-performance 3B–8B local open-weight models now match previous frontier models on basic classification and formatting tasks at zero marginal compute cost.',
    difficulty: 'large',
    technicalStack: ['Node.js or Python', 'Ollama', 'vLLM', 'PostgreSQL', 'Docker'],
    requiredSkills: ['Quantisation (GGUF / AWQ)', 'Inference Optimization', 'TypeScript', 'Docker'],
    implementationSteps: [
      { step: 1, title: 'Complexity Classifier', detail: 'Build a lightweight heuristic and embedding classifier to score query complexity.' },
      { step: 2, title: 'Local Runtime Integration', detail: 'Connect to local inference endpoints running quantized models via Ollama or vLLM.' },
      { step: 3, title: 'Automated Fallback & Validation', detail: 'Validate output schema; automatically re-route to cloud API if local output fails validation.' },
      { step: 4, title: 'Cost & Latency Dashboard', detail: 'Track monthly cost savings, latency percentiles, and token consumption.' },
    ],
    potentialChallenges: [
      'Minimizing routing overhead latency so the routing decision does not offset local execution gains.',
      'Managing local GPU/VRAM memory limits during burst concurrency.',
    ],
    keywords: ['ollama', 'vllm', 'inference', 'quantization', 'router', 'local'],
    relatedTrendSlugs: ['local-and-hybrid-model-inference'],
  },
  {
    slug: 'multi-agent-pr-review-harness',
    title: 'Multi-Agent PR Review & Deterministic Verification Harness',
    problemStatement:
      'Single-pass AI code reviewers suffer from high false-positive rates, suggesting changes that fail compiler checks or violate project linting rules.',
    targetUser: 'Open-source maintainers and software development teams.',
    proposedSolution:
      'A multi-agent review pipeline where an analysis agent drafts potential improvements, a sandbox agent runs real linters and unit tests on the suggested patch, and a synthesis agent posts only verified feedback.',
    whyNow:
      'Coding agent frameworks and fast sandboxed containers allow closing the feedback loop between generation and real execution.',
    difficulty: 'large',
    technicalStack: ['TypeScript', 'GitHub API', 'Docker', 'Vitest'],
    requiredSkills: ['Autonomous Agents', 'TypeScript', 'Unit & E2E Testing', 'Docker'],
    implementationSteps: [
      { step: 1, title: 'GitHub Webhook Ingestion', detail: 'Listen for pull request events and extract git diffs and context files.' },
      { step: 2, title: 'Analyzer Agent Loop', detail: 'Analyze code diff for potential bugs, security oversights, and performance regressions.' },
      { step: 3, title: 'Sandboxed Verification', detail: 'Apply suggested patches inside an isolated container and run linter and test suite.' },
      { step: 4, title: 'Verified Summary Generation', detail: 'Post structured comments with passing reproduction proofs and explanation.' },
    ],
    potentialChallenges: [
      'Safely sandboxing untrusted PR code execution to prevent arbitrary code execution on the host.',
      'Keeping CI run durations within acceptable developer waiting windows.',
    ],
    keywords: ['coding agents', 'agent', 'benchmark', 'github', 'review'],
    relatedTrendSlugs: ['agentic-workflows-and-tool-use-protocols'],
  },
];

/**
 * Generates personalized project opportunities by matching blueprints against profile skills
 * and backing evidence items from the database.
 */
export function generateProjectOpportunities(
  profile: UserProfile,
  items: ItemFull[]
): ProjectOpportunity[] {
  const userSkillNames = new Set(profile.skills.map((s) => s.name.toLowerCase()));
  const userTechNames = new Set(profile.technologies.map((t) => t.toLowerCase()));

  const opportunities: ProjectOpportunity[] = [];

  for (const bp of PROJECT_BLUEPRINTS) {
    // Determine skills matched vs skills to learn
    const skillsMatched: string[] = [];
    const skillsToLearn: string[] = [];

    for (const reqSkill of bp.requiredSkills) {
      const lowerReq = reqSkill.toLowerCase();
      const isMatched =
        userSkillNames.has(lowerReq) ||
        userTechNames.has(lowerReq) ||
        Array.from(userSkillNames).some((s) => lowerReq.includes(s) || s.includes(lowerReq));

      if (isMatched) {
        skillsMatched.push(reqSkill);
      } else {
        skillsToLearn.push(reqSkill);
      }
    }

    // Match evidence items from collected database
    const evidenceItems: Array<{ id: string; title: string; url: string; sourceName: string }> = [];
    for (const item of items) {
      const text = `${item.title} ${item.description || ''} ${item.summary?.summary || ''}`.toLowerCase();
      const matchesKeyword = bp.keywords.some((kw) => text.includes(kw));
      if (matchesKeyword && evidenceItems.length < 3) {
        evidenceItems.push({
          id: item.id,
          title: item.title,
          url: item.canonical_url,
          sourceName: item.source?.name || 'Primary Source',
        });
      }
    }

    opportunities.push({
      id: `proj-${bp.slug}`,
      slug: bp.slug,
      title: bp.title,
      problemStatement: bp.problemStatement,
      targetUser: bp.targetUser,
      proposedSolution: bp.proposedSolution,
      whyNow: bp.whyNow,
      difficulty: bp.difficulty,
      technicalStack: bp.technicalStack,
      requiredSkills: bp.requiredSkills,
      skillsMatched,
      skillsToLearn,
      implementationSteps: bp.implementationSteps,
      potentialChallenges: bp.potentialChallenges,
      evidenceItems,
      relatedTrendSlugs: bp.relatedTrendSlugs,
      userStatus: 'active',
      userNotes: null,
      metadata: {
        skillsMatchedCount: skillsMatched.length,
        skillsToLearnCount: skillsToLearn.length,
        evidenceCount: evidenceItems.length,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Sort by skillsMatched count descending (projects user is best equipped to start now)
  return opportunities.sort((a, b) => b.skillsMatched.length - a.skillsMatched.length);
}
