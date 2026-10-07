// =============================================================================
// AI Radar — Learning Intelligence & Topic Map Engine
// =============================================================================
// Provides curated learning pathways grounded in real collected papers,
// tools, and developer implementations.
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { LearningTopic } from './types';

interface TopicBlueprint {
  slug: string;
  title: string;
  category: string;
  summary: string;
  whyRelevant: string;
  prerequisites: string[];
  keyConcepts: string[];
  technologies: string[];
  starterProject: string;
  advancedProject: string;
  keywords: string[];
}

const TOPIC_BLUEPRINTS: TopicBlueprint[] = [
  {
    slug: 'agent-protocols-and-mcp',
    title: 'Agent Tool Protocols & Model Context Protocol (MCP)',
    category: 'Agent Architecture',
    summary:
      'Understanding open protocols that standardize how language models discover, inspect, and invoke tools across developer environments and services.',
    whyRelevant:
      'Replaces brittle custom one-off tool integrations with an ecosystem standard supported by multiple major AI assistants.',
    prerequisites: ['Basic TypeScript or Python', 'HTTP & JSON-RPC Fundamentals', 'LLM Function Calling Basics'],
    keyConcepts: [
      'JSON-RPC Message Specifications',
      'Client / Server Separation in Agent Stacks',
      'Resource Schemas vs Tool Execution Schemas',
      'Security Permissions & User Approval Boundaries',
    ],
    technologies: ['Model Context Protocol (MCP)', 'TypeScript', 'Node.js', 'Zod'],
    starterProject: 'Build a minimal MCP server that reads a local sqlite database and exposes a query tool.',
    advancedProject: 'Build an authenticated MCP gateway that routes queries across multiple microservices with rate limits.',
    keywords: ['mcp', 'protocol', 'agent', 'tool calling'],
  },
  {
    slug: 'reasoning-models-and-test-time-compute',
    title: 'Reasoning Models, Thinking Tokens & Test-Time Compute',
    category: 'Model Capabilities',
    summary:
      'How frontier reasoning models trade test-time computation and chain-of-thought tokens for improved accuracy on complex coding, math, and logic problems.',
    whyRelevant:
      'Changes prompt engineering from instruction tweaking to verifiable step-by-step problem framing and automated solution verification.',
    prerequisites: ['Prompt Engineering Basics', 'Python Fundamentals', 'Basic Statistics & Probability'],
    keyConcepts: [
      'Inference-Time Scaling Laws',
      'Thinking Tokens & Tracing Hidden Reasoning',
      'Self-Correction & Verification Loops',
      'Parsing Structured Answers from Reasoning Traces',
    ],
    technologies: ['Python', 'Hugging Face Transformers', 'Ollama', 'PyTest'],
    starterProject: 'Build an automated puzzle solver comparing accuracy between direct prompting and reasoning tokens.',
    advancedProject: 'Implement a Monte Carlo tree search verification loop for code generation on a local model.',
    keywords: ['reasoning', 'thinking', 'test-time', 'cot', 'math', 'logic'],
  },
  {
    slug: 'rag-evaluation-and-grounding',
    title: 'Production RAG Evaluation & Grounding Verification',
    category: 'Evaluation & QA',
    summary:
      'Systematic benchmarking of retrieval quality, context compression, and citation grounding in enterprise RAG pipelines.',
    whyRelevant:
      'Moving from prototype RAG to production requires deterministic proof of answer faithfulness and minimal hallucination.',
    prerequisites: ['Vector Database Concepts', 'Embedding Basics', 'Automated Unit Testing'],
    keyConcepts: [
      'Faithfulness vs Answer Relevance Metrics',
      'Chunking Strategies (Fixed, Semantic, Hierarchical)',
      'Cross-Encoder Reranking',
      'Grounding Verification Algorithms',
    ],
    technologies: ['Python', 'PostgreSQL / pgvector', 'FastAPI', 'Vitest'],
    starterProject: 'Create a synthetic evaluation dataset of 20 questions and assert answer faithfulness on 3 chunk sizes.',
    advancedProject: 'Build an automated CI check that fails pull requests if documentation RAG accuracy drops below 90%.',
    keywords: ['rag', 'eval', 'evaluation', 'benchmark', 'retrieval'],
  },
  {
    slug: 'local-model-quantisation-and-deployment',
    title: 'Local Model Quantisation (GGUF/AWQ) & Edge Deployment',
    category: 'Infrastructure & Runtimes',
    summary:
      'Techniques for compressing open-weight models into low-bit representations (INT4/INT8) and running them efficiently on local workstations or edge servers.',
    whyRelevant:
      'Enables privacy-conscious offline workflows, zero-token-cost local dev loops, and high-throughput microservices.',
    prerequisites: ['Basic Command Line & Docker', 'Hardware Understanding (CPU vs GPU vs VRAM)', 'Python'],
    keyConcepts: [
      'Weight-Only vs Activation Quantisation',
      'GGUF File Format & llama.cpp Runtimes',
      'KV Cache Management & Paged Attention',
      'Cost/Latency Tradeoff Curves',
    ],
    technologies: ['Ollama', 'vLLM', 'llama.cpp', 'Docker'],
    starterProject: 'Set up an Ollama instance locally and benchmark token generation speeds across 4-bit and 8-bit quantized models.',
    advancedProject: 'Deploy a containerized vLLM service with automated health checks, batching, and fallback routing.',
    keywords: ['quantization', 'gguf', 'ollama', 'vllm', 'inference', 'local'],
  },
];

/**
 * Builds learning topics linked to actual database items
 */
export function getLearningTopics(items: ItemFull[]): LearningTopic[] {
  return TOPIC_BLUEPRINTS.map((bp) => {
    // Find related real items from the collected dataset
    const relatedItems: Array<{ id: string; title: string; url: string }> = [];

    for (const item of items) {
      const text = `${item.title} ${item.description || ''} ${item.summary?.summary || ''}`.toLowerCase();
      const matches = bp.keywords.some((kw) => text.includes(kw));

      if (matches && relatedItems.length < 3) {
        relatedItems.push({
          id: item.id,
          title: item.title,
          url: item.canonical_url,
        });
      }
    }

    return {
      id: `topic-${bp.slug}`,
      title: bp.title,
      slug: bp.slug,
      category: bp.category,
      summary: bp.summary,
      whyRelevant: bp.whyRelevant,
      prerequisites: bp.prerequisites,
      keyConcepts: bp.keyConcepts,
      technologies: bp.technologies,
      relatedItems,
      starterProject: bp.starterProject,
      advancedProject: bp.advancedProject,
      userStatus: 'active',
      metadata: {
        relatedItemsCount: relatedItems.length,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}
