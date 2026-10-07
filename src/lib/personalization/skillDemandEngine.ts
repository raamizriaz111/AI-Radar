// =============================================================================
// AI Radar — Skill Demand & Technology Frequency Engine
// =============================================================================
// Analyzes collected items and trends to detect high-frequency skills,
// emerging technologies, and rising developer demand without fabricating data.
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { UserProfile } from './types';

export interface SkillDemandMetric {
  name: string;
  category: string;
  frequency: number;
  uniqueSources: number;
  recentItemTitles: string[];
  userProficiency: 'untracked' | 'beginner' | 'intermediate' | 'advanced' | 'interested';
  status: 'surging' | 'rising' | 'steady' | 'emerging';
  relevanceToProfile: boolean;
}

/**
 * Standard technology knowledge-base mapping keywords to clean skill categories
 */
const SKILL_CATEGORY_MAP: Record<string, string> = {
  python: 'Languages',
  typescript: 'Languages',
  javascript: 'Languages',
  rust: 'Languages',
  golang: 'Languages',
  pytorch: 'ML Frameworks',
  transformers: 'ML Frameworks',
  huggingface: 'Platforms',
  nextjs: 'Web Frameworks',
  react: 'Web Frameworks',
  fastapi: 'Backend',
  ollama: 'Local AI / Runtimes',
  vllm: 'Inference Engines',
  llama: 'Model Families',
  deepseek: 'Model Families',
  qwen: 'Model Families',
  claude: 'Frontier Models',
  gpt: 'Frontier Models',
  gemini: 'Frontier Models',
  rag: 'Architectures',
  agents: 'Agentic Systems',
  mcp: 'Agent Protocols',
  langchain: 'Agent Frameworks',
  langgraph: 'Agent Frameworks',
  crewai: 'Agent Frameworks',
  autogen: 'Agent Frameworks',
  eval: 'Evaluation & Benchmarks',
  benchmark: 'Evaluation & Benchmarks',
  benchmarks: 'Evaluation & Benchmarks',
  quantization: 'Efficiency & Quantisation',
  fine_tuning: 'Training & Adaptation',
  finetuning: 'Training & Adaptation',
  cot: 'Reasoning & Inference',
  reasoning: 'Reasoning & Inference',
};

/**
 * Clean canonical display names
 */
const CANONICAL_NAMES: Record<string, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  rust: 'Rust',
  pytorch: 'PyTorch',
  transformers: 'Hugging Face Transformers',
  nextjs: 'Next.js',
  react: 'React',
  fastapi: 'FastAPI',
  ollama: 'Ollama',
  vllm: 'vLLM',
  rag: 'RAG Architectures',
  agents: 'Autonomous Agents',
  mcp: 'Model Context Protocol (MCP)',
  langchain: 'LangChain',
  langgraph: 'LangGraph',
  crewai: 'CrewAI',
  eval: 'Model Evaluation & Benchmarking',
  benchmark: 'Benchmark Validation',
  quantization: 'Quantisation (GGUF / AWQ)',
  fine_tuning: 'Fine-Tuning (LoRA / QLoRA)',
  finetuning: 'Fine-Tuning (LoRA / QLoRA)',
  reasoning: 'Reasoning & Thinking Models',
};

/**
 * Extracts and aggregates skill signals from a corpus of collected items.
 */
export function analyzeSkillDemand(
  items: ItemFull[],
  profile?: UserProfile | null
): SkillDemandMetric[] {
  const counts: Record<
    string,
    {
      count: number;
      sources: Set<string>;
      titles: string[];
    }
  > = {};

  for (const item of items) {
    const sourceName = item.source?.name || 'Unknown Source';
    const metadataObj = (item.metadata || {}) as Record<string, unknown>;
    
    // Collect potential tech mentions
    const summaryObj = item.summary as any;
    const summaryTechs = Array.isArray(summaryObj?.technologies) ? (summaryObj.technologies as string[]) : [];
    const summaryTopics = Array.isArray(summaryObj?.topics) ? (summaryObj.topics as string[]) : [];

    const rawTerms: string[] = [
      ...(Array.isArray(metadataObj.technologies) ? (metadataObj.technologies as string[]) : []),
      ...summaryTechs,
      ...summaryTopics,
    ];

    // Also inspect item title and description for high-signal keywords
    const textBlob = `${item.title} ${item.description || ''} ${item.summary?.summary || ''}`.toLowerCase();
    
    for (const [key] of Object.entries(SKILL_CATEGORY_MAP)) {
      if (textBlob.includes(key)) {
        rawTerms.push(key);
      }
    }

    // De-duplicate terms per item
    const uniqueTermsInItem = Array.from(new Set(rawTerms.map((t) => t.toLowerCase().trim())));

    for (const term of uniqueTermsInItem) {
      // Find known category
      let matchedKey = '';
      for (const key of Object.keys(SKILL_CATEGORY_MAP)) {
        if (term === key || term.includes(key)) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) continue;

      if (!counts[matchedKey]) {
        counts[matchedKey] = {
          count: 0,
          sources: new Set(),
          titles: [],
        };
      }

      counts[matchedKey].count += 1;
      counts[matchedKey].sources.add(sourceName);
      if (counts[matchedKey].titles.length < 3 && !counts[matchedKey].titles.includes(item.title)) {
        counts[matchedKey].titles.push(item.title);
      }
    }
  }

  // Convert to output metrics
  const results: SkillDemandMetric[] = Object.entries(counts).map(([key, data]) => {
    const canonicalName = CANONICAL_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1);
    const category = SKILL_CATEGORY_MAP[key] || 'General AI';

    // Check user proficiency if profile supplied
    let userProficiency: SkillDemandMetric['userProficiency'] = 'untracked';
    let relevanceToProfile = false;

    if (profile) {
      const userSkill = profile.skills.find(
        (s) => s.name.toLowerCase() === canonicalName.toLowerCase() || s.name.toLowerCase().includes(key)
      );
      if (userSkill) {
        userProficiency = userSkill.level;
        relevanceToProfile = true;
      } else {
        const isTechInStack = profile.technologies.some(
          (t) => t.toLowerCase().includes(key) || key.includes(t.toLowerCase())
        );
        if (isTechInStack) {
          relevanceToProfile = true;
        }
      }
    }

    let status: SkillDemandMetric['status'] = 'steady';
    if (data.count >= 8 && data.sources.size >= 2) {
      status = 'surging';
    } else if (data.count >= 4) {
      status = 'rising';
    } else if (data.sources.size === 1 && data.count <= 2) {
      status = 'emerging';
    }

    return {
      name: canonicalName,
      category,
      frequency: data.count,
      uniqueSources: data.sources.size,
      recentItemTitles: data.titles,
      userProficiency,
      status,
      relevanceToProfile,
    };
  });

  // Sort by frequency descending
  return results.sort((a, b) => b.frequency - a.frequency);
}
