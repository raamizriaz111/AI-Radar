// =============================================================================
// AI Radar — Evidence-Grounded Career Signals Engine
// =============================================================================
// Identifies shifts in engineering roles, architectural patterns, and tool demand
// based on clusters of collected items and trends.
//
// Principles:
// - Never make salary guarantees or employment promises.
// - All signals must link directly to primary evidence items and trends.
// - Clearly separate observed facts from career implications.
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { CareerSignal, CareerSignalType, CareerSignalStrength } from './types';

interface SignalBlueprint {
  id: string;
  roleOrDomain: string;
  signalType: CareerSignalType;
  title: string;
  description: string;
  whyItMatters: string;
  keywords: string[];
  skills: string[];
  technologies: string[];
}

const SIGNAL_BLUEPRINTS: SignalBlueprint[] = [
  {
    id: 'signal-agent-orchestration',
    roleOrDomain: 'AI Systems Engineering',
    signalType: 'architectural_shift',
    title: 'Shift from Prompt Templates to Deterministic Agent Orchestration',
    description: 'Engineering teams are moving beyond static prompts toward multi-step agent loops, structured tool calling protocols, and automated retry harnesses.',
    whyItMatters: 'Demonstrating skill in agent loop control, error recovery, and context management is becoming more valuable than basic prompt engineering.',
    keywords: ['agent', 'agents', 'tool calling', 'react', 'orchestration', 'workflow', 'langgraph', 'crewai'],
    skills: ['Agent Architecture', 'Tool Protocol Design', 'Error Recovery Loop Design'],
    technologies: ['TypeScript', 'Python', 'LangGraph', 'Model Context Protocol (MCP)'],
  },
  {
    id: 'signal-eval-engineering',
    roleOrDomain: 'AI Quality & Reliability',
    signalType: 'emerging_role',
    title: 'Emergence of AI Evaluation & Benchmark Engineering',
    description: 'As models become commodities, the ability to build deterministic evaluation harnesses, test suites, and drift detection systems is becoming a dedicated discipline.',
    whyItMatters: 'Teams building production AI require verifiable benchmarks and regression testing to validate model upgrades without breaking downstream applications.',
    keywords: ['eval', 'evaluation', 'benchmark', 'benchmarks', 'accuracy', 'regression', 'metrics'],
    skills: ['Deterministic Evaluation', 'Benchmark Construction', 'Automated QA Harnesses'],
    technologies: ['Python', 'PyTest', 'Vitest', 'Custom Eval Harnesses'],
  },
  {
    id: 'signal-local-hybrid-inference',
    roleOrDomain: 'Infrastructure & Edge AI',
    signalType: 'workflow_shift',
    title: 'Adoption of Local & Hybrid Model Inference Stacks',
    description: 'Developers are pairing frontier cloud APIs with local quantized models (GGUF, Ollama, vLLM) to reduce costs and latency for routine tasks.',
    whyItMatters: 'Architects who understand model quantisation, VRAM constraints, and fallback routing can deliver higher-margin, privacy-conscious solutions.',
    keywords: ['ollama', 'vllm', 'quantization', 'gguf', 'local model', 'inference', 'edge', 'onnx'],
    skills: ['Local Model Deployment', 'Quantisation Analysis', 'Inference Optimization'],
    technologies: ['Ollama', 'vLLM', 'llama.cpp', 'Docker'],
  },
  {
    id: 'signal-mcp-protocol-standard',
    roleOrDomain: 'Developer Tooling & Integration',
    signalType: 'increasing_demand',
    title: 'Standardization on Tool Calling & Context Protocols (MCP)',
    description: 'Protocol-level specifications like Model Context Protocol (MCP) are enabling modular connections between AI models and developer environments.',
    whyItMatters: 'Building interoperable tool servers that can plug into any agent platform creates wider utility than writing single-provider custom connectors.',
    keywords: ['mcp', 'context protocol', 'model context', 'protocol', 'json-rpc', 'server'],
    skills: ['Protocol Implementation', 'JSON-RPC Interop', 'Security Boundary Design'],
    technologies: ['Model Context Protocol (MCP)', 'TypeScript', 'Node.js', 'Python'],
  },
];

/**
 * Discovers and validates career signals by matching blueprints against real collected items.
 */
export function detectCareerSignals(
  items: ItemFull[],
  trends: Array<{ id: string; title: string; slug: string }> = []
): CareerSignal[] {
  const signals: CareerSignal[] = [];

  for (const blueprint of SIGNAL_BLUEPRINTS) {
    // Collect evidence items from real corpus
    const evidenceItems: Array<{ id: string; title: string; url: string; sourceName: string }> = [];
    const sourceTypes = new Set<string>();

    for (const item of items) {
      const text = `${item.title} ${item.description || ''} ${item.summary?.summary || ''}`.toLowerCase();
      const matchesKeyword = blueprint.keywords.some((kw) => text.includes(kw));

      if (matchesKeyword) {
        if (evidenceItems.length < 5) {
          evidenceItems.push({
            id: item.id,
            title: item.title,
            url: item.canonical_url,
            sourceName: item.source?.name || 'External Source',
          });
        }
        if (item.source?.source_type) {
          sourceTypes.add(item.source.source_type);
        }
      }
    }

    // Match supporting trends
    const supportingTrends = trends
      .filter((t) => {
        const titleLower = t.title.toLowerCase();
        return blueprint.keywords.some((kw) => titleLower.includes(kw));
      })
      .slice(0, 3);

    // Compute signal strength based on evidence volume and source diversity
    let strength: CareerSignalStrength = 'emerging';
    if (evidenceItems.length >= 4 && sourceTypes.size >= 2) {
      strength = 'strong';
    } else if (evidenceItems.length >= 2) {
      strength = 'moderate';
    }

    signals.push({
      id: blueprint.id,
      roleOrDomain: blueprint.roleOrDomain,
      signalType: blueprint.signalType,
      title: blueprint.title,
      description: blueprint.description,
      evidenceItems,
      supportingTrends,
      technologies: blueprint.technologies,
      skills: blueprint.skills,
      strength,
      whyItMatters: blueprint.whyItMatters,
      sourceTypes: Array.from(sourceTypes),
      metadata: {
        evidenceCount: evidenceItems.length,
        sourceDiversity: sourceTypes.size,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Sort by strength: strong first, then moderate, then emerging
  const order: Record<CareerSignalStrength, number> = { strong: 1, moderate: 2, emerging: 3 };
  return signals.sort((a, b) => order[a.strength] - order[b.strength]);
}
