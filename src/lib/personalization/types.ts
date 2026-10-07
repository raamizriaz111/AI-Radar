// =============================================================================
// AI Radar — Personal Intelligence & Career Domain Types & Constants
// =============================================================================

import {
  UserProfile,
  CareerSignal,
  SkillGap,
  ProjectOpportunity,
  LearningTopic,
  UserIntelligenceFeedback,
  PersonalRelevanceMatch,
  ExperienceLevel,
  SkillProficiency,
  UserSkill,
  CareerSignalType,
  CareerSignalStrength,
  SkillGapType,
  SkillGapActionStatus,
  ProjectOpportunityDifficulty,
  ProjectOpportunityStatus,
} from '@/lib/types';

export type {
  UserProfile,
  CareerSignal,
  SkillGap,
  ProjectOpportunity,
  LearningTopic,
  UserIntelligenceFeedback,
  PersonalRelevanceMatch,
  ExperienceLevel,
  SkillProficiency,
  UserSkill,
  CareerSignalType,
  CareerSignalStrength,
  SkillGapType,
  SkillGapActionStatus,
  ProjectOpportunityDifficulty,
  ProjectOpportunityStatus,
};

/**
 * Standard default user profile for AI Radar.
 * Applied on initial launch or when no database record exists.
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: null,
  name: 'AI Engineer / Researcher',
  experienceLevel: 'intermediate',
  primaryRoleInterest: 'AI / Full Stack Engineer',
  secondaryRoleInterests: [
    'AI Agent Developer',
    'Applied ML Engineer',
    'Technical Product Architect',
  ],
  skills: [
    { name: 'TypeScript', level: 'advanced', category: 'Languages' },
    { name: 'Python', level: 'intermediate', category: 'Languages' },
    { name: 'Next.js', level: 'advanced', category: 'Frameworks' },
    { name: 'React', level: 'advanced', category: 'Frameworks' },
    { name: 'Prompt Engineering', level: 'intermediate', category: 'AI / LLM' },
    { name: 'RAG Architecture', level: 'intermediate', category: 'AI / LLM' },
    { name: 'Vector Databases', level: 'beginner', category: 'Data & Infra' },
    { name: 'Model Evaluation', level: 'beginner', category: 'Evaluation' },
  ],
  technologies: [
    'TypeScript',
    'Python',
    'Next.js',
    'React',
    'PostgreSQL',
    'Supabase',
    'Tailwind CSS',
    'LangChain',
    'Hugging Face',
  ],
  careerGoals: [
    'Build production-grade coding agents and workflow automation',
    'Deepen understanding of frontier model capabilities and reasoning tokens',
    'Ship real developer tools that solve concrete engineering workflows',
  ],
  learningGoals: [
    'Agentic workflows & tool use protocols',
    'Model evaluation & benchmark validation',
    'Small local models & quantisation (GGUF, Ollama)',
    'Context window management & structured outputs',
  ],
  projectInterests: [
    'Developer intelligence & code review copilots',
    'Evidence-grounded information pipelines',
    'Automated research paper synthesis tools',
  ],
  preferredTopics: [
    'coding-agents',
    'models',
    'ai-tools',
    'research',
    'emerging-trends',
    'rag',
    'agents',
    'evaluation',
  ],
  excludedTopics: [
    'crypto',
    'nft',
    'unverified-rumors',
  ],
  metadata: {
    initializedVersion: 'phase6',
    customNotes: 'Default engineering profile initialized.',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Standard catalog of common skills categorized for UI selection
 */
export const SKILL_TAXONOMY: Record<string, string[]> = {
  'Languages': ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'C++', 'SQL'],
  'Frameworks & Libraries': ['Next.js', 'React', 'Node.js', 'FastAPI', 'PyTorch', 'Transformers', 'LangChain', 'LlamaIndex'],
  'AI / LLM Concepts': ['Prompt Engineering', 'RAG Architecture', 'Fine-Tuning', 'Quantisation', 'Agent Workflows', 'Tool Calling', 'Structured Outputs', 'Reasoning Models'],
  'Data & Infrastructure': ['PostgreSQL', 'Supabase', 'Vector Databases', 'Docker', 'Redis', 'Embedding Pipelines', 'Cloud Run / AWS'],
  'Evaluation & Reliability': ['Model Evaluation', 'Benchmark Validation', 'Red Teaming', 'Guardrails', 'Tracing & Observability', 'Unit & E2E Testing'],
};

/**
 * Common AI roles for selection
 */
export const ROLE_OPTIONS: string[] = [
  'AI / Full Stack Engineer',
  'AI Agent Developer',
  'Applied ML Engineer',
  'MLOps / Infra Engineer',
  'AI Systems Architect',
  'Technical Product Manager (AI)',
  'AI Safety & Evaluation Engineer',
  'Data Scientist / Research Engineer',
];
