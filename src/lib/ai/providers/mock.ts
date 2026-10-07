// =============================================================================
// AI Radar — Heuristic / Mock AI Provider (Phase 4)
// =============================================================================
// Deterministic, high-fidelity mock provider used for testing, CI, and
// local development when no commercial AI provider key is configured.
//
// Generates structured output that strictly satisfies the schema,
// extracts entities/technologies/claims based on rule heuristics,
// and clearly labels output as mock/heuristic.
// =============================================================================

import { BaseAIProvider } from './base';
import type { AIEnrichmentOutput } from '@/lib/validation/schemas';

const KNOWN_TECH = [
  'PyTorch', 'TensorFlow', 'JAX', 'Transformers', 'CUDA', 'Python', 'TypeScript',
  'Rust', 'vLLM', 'Ollama', 'LangChain', 'LlamaIndex', 'Hugging Face', 'DeepSpeed',
  'Triton', 'Next.js', 'React', 'Docker', 'Kubernetes',
];

const KNOWN_ENTITIES = [
  { name: 'OpenAI', type: 'company' },
  { name: 'Anthropic', type: 'company' },
  { name: 'Google DeepMind', type: 'company' },
  { name: 'Meta AI', type: 'company' },
  { name: 'Mistral AI', type: 'company' },
  { name: 'Microsoft', type: 'company' },
  { name: 'Hugging Face', type: 'organization' },
  { name: 'arXiv', type: 'organization' },
  { name: 'GitHub', type: 'organization' },
  { name: 'GPT-4', type: 'model' },
  { name: 'Claude', type: 'model' },
  { name: 'Gemini', type: 'model' },
  { name: 'Llama', type: 'model' },
];

export class MockAIProvider extends BaseAIProvider {
  readonly id = 'mock';
  readonly displayName = 'Mock / Heuristic AI';
  readonly defaultModel = 'heuristic-mock-v1';

  protected async executeRawCompletion(
    _systemPrompt: string,
    userPrompt: string,
    _modelName: string
  ): Promise<{ rawText: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }> {
    // Extract title and text from userPrompt
    const titleMatch = userPrompt.match(/Title:\s*(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'AI Development';

    const sourceMatch = userPrompt.match(/Source:\s*(.+)/i);
    const sourceName = sourceMatch ? sourceMatch[1].trim() : 'Primary Source';

    const docMatch = userPrompt.match(/<source_document>([\s\S]*?)<\/source_document>/i);
    const content = docMatch ? docMatch[1].trim() : '';

    const textToAnalyze = `${title} ${content}`.toLowerCase();

    // Extract detected technologies
    const detectedTech = KNOWN_TECH.filter((tech) => textToAnalyze.includes(tech.toLowerCase()));
    if (detectedTech.length === 0) detectedTech.push('Machine Learning', 'Artificial Intelligence');

    // Extract detected entities
    const detectedEntities = KNOWN_ENTITIES.filter((ent) => textToAnalyze.includes(ent.name.toLowerCase()));
    if (detectedEntities.length === 0) {
      detectedEntities.push({ name: sourceName, type: 'organization' });
    }

    // Extract topics
    const topics: string[] = [];
    if (/llm|language model/i.test(textToAnalyze)) topics.push('LLM');
    if (/agent|copilot/i.test(textToAnalyze)) topics.push('AI Agents');
    if (/vision|image|multimodal/i.test(textToAnalyze)) topics.push('Multimodal AI');
    if (/benchmark|eval/i.test(textToAnalyze)) topics.push('Evaluation & Benchmarks');
    if (/safety|alignment/i.test(textToAnalyze)) topics.push('AI Safety');
    if (topics.length === 0) topics.push('Foundation Models');

    // Extract key points
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && !s.includes('<') && !s.includes('>'));

    const keyPoints = sentences.slice(0, 3);
    if (keyPoints.length === 0) {
      keyPoints.push(`Development reported by ${sourceName}: ${title}.`);
      keyPoints.push('Source details verified against primary publisher feed.');
    }

    const summary = content.length > 60
      ? `${title}. ${sourceName} reports on updates involving ${detectedTech.slice(0, 2).join(' and ')}, explaining how this affects tools and people using AI.`
      : `${title} reported by ${sourceName}.`;

    const significance = `This is an important development in ${topics.slice(0, 2).join(' and ')}. It shows how AI is continuing to evolve and affect everyday users, workers, and businesses.`;

    const claims: AIEnrichmentOutput['claims'] = [
      {
        text: `Source announced or documented: "${title}"`,
        claim_type: 'announcement',
        is_direct_quote: false,
        confidence: 'high',
        importance: 'high',
        source_support: `Reported by ${sourceName}`,
      },
    ];

    if (sentences.length > 0) {
      claims.push({
        text: sentences[0].slice(0, 200),
        claim_type: 'finding',
        is_direct_quote: false,
        confidence: 'high' as const,
        importance: 'moderate' as const,
        source_support: sentences[0].slice(0, 100),
      });
    }

    const output: AIEnrichmentOutput = {
      summary,
      key_points: keyPoints,
      significance,
      claims,
      entities: detectedEntities.slice(0, 8),
      technologies: detectedTech.slice(0, 8),
      topics: topics.slice(0, 5),
      suggested_categories: ['models'],
      suggested_item_type: 'research_paper',
      confidence: 0.88,
      warning_flags: [],
    };

    return {
      rawText: JSON.stringify(output),
      usage: {
        promptTokens: 250,
        completionTokens: 180,
        totalTokens: 430,
      },
    };
  }

  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: 'Mock AI provider is ready (deterministic offline mode).' };
  }
}

export const mockAIProvider = new MockAIProvider();
