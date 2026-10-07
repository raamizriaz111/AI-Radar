// =============================================================================
// AI Radar — Upcoming AI Horizon & Release Radar Service
// =============================================================================
// Tracks upcoming AI model drops, developer summits, product launches,
// and regulatory enforcement deadlines.
// Gives users forward-looking visibility into what is coming next in AI.
// =============================================================================

export interface HorizonEvent {
  id: string;
  title: string;
  category: 'model_drop' | 'developer_event' | 'regulation' | 'hardware' | 'product';
  categoryLabel: string;
  expectedTimeframe: string;
  targetDateISO?: string;
  organization: string;
  status: 'Confirmed' | 'Expected' | 'Industry Horizon';
  statusColor: 'emerald' | 'amber' | 'blue' | 'purple';
  summary: string;
  whyItMatters: string;
  impactScore: number; // 1-100
  tags: string[];
}

export const UPCOMING_HORIZON_EVENTS: HorizonEvent[] = [
  {
    id: 'horizon-gpt5-orion',
    title: 'OpenAI Next-Generation Frontier Model (Orion / GPT-5)',
    category: 'model_drop',
    categoryLabel: 'Next-Gen Model',
    expectedTimeframe: 'Late 2026',
    targetDateISO: '2026-11-15T00:00:00Z',
    organization: 'OpenAI',
    status: 'Expected',
    statusColor: 'amber',
    summary: 'Next major flagship foundational model from OpenAI featuring advanced synthetic data pre-training and recursive self-correction reasoning.',
    whyItMatters: 'Expected to significantly jump coding, scientific mathematical proofs, and autonomous multi-hour workflow execution.',
    impactScore: 98,
    tags: ['OpenAI', 'Reasoning', 'Frontier Model', 'Automation'],
  },
  {
    id: 'horizon-claude-4',
    title: 'Anthropic Claude 4 Series & Computer-Use 2.0',
    category: 'model_drop',
    categoryLabel: 'Agentic Model',
    expectedTimeframe: 'Q4 2026',
    targetDateISO: '2026-11-01T00:00:00Z',
    organization: 'Anthropic',
    status: 'Expected',
    statusColor: 'purple',
    summary: 'Next iteration of Claude architecture with upgraded native computer interaction, multi-screen awareness, and low-latency tool orchestrations.',
    whyItMatters: 'Enables autonomous software agents that can control browser and desktop operating systems directly without human intervention.',
    impactScore: 94,
    tags: ['Anthropic', 'Computer Use', 'Autonomous Agents', 'Safety'],
  },
  {
    id: 'horizon-eu-ai-act-phase2',
    title: 'EU AI Act High-Risk System Enforcement Deadline',
    category: 'regulation',
    categoryLabel: 'Global Regulation',
    expectedTimeframe: 'Late 2026',
    targetDateISO: '2026-12-01T00:00:00Z',
    organization: 'European Commission',
    status: 'Confirmed',
    statusColor: 'emerald',
    summary: 'Mandatory compliance checks for AI systems deployed in healthcare, education, critical infrastructure, and biometric identification in Europe.',
    whyItMatters: 'Global tech companies face fines of up to 7% of annual global turnover for non-compliant models deployed inside the EU.',
    impactScore: 92,
    tags: ['EU AI Act', 'Compliance', 'Governance', 'Global Policy'],
  },
  {
    id: 'horizon-gemini-2-5',
    title: 'Google Gemini 2.5 Multi-Modal Live Audio & Video Rollout',
    category: 'product',
    categoryLabel: 'Consumer AI',
    expectedTimeframe: 'Upcoming Weeks',
    targetDateISO: '2026-10-25T00:00:00Z',
    organization: 'Google DeepMind',
    status: 'Confirmed',
    statusColor: 'emerald',
    summary: 'Full release of real-time conversational visual AI across Android devices, search, and Google Workspace applications with zero audio lag.',
    whyItMatters: 'Puts conversational visual intelligence into the hands of billions of everyday smartphone users for real-time translation and troubleshooting.',
    impactScore: 90,
    tags: ['Google', 'Gemini', 'Android', 'Live Vision'],
  },
  {
    id: 'horizon-llama-4',
    title: 'Meta Llama 4 Open Weights Release (100k+ Cluster)',
    category: 'model_drop',
    categoryLabel: 'Open Source AI',
    expectedTimeframe: 'Late 2026 / Early 2027',
    targetDateISO: '2026-12-15T00:00:00Z',
    organization: 'Meta AI',
    status: 'Industry Horizon',
    statusColor: 'blue',
    summary: 'Trained on Meta’s monumental 100,000+ H100 cluster. Expected to include native multimodal audio/video and competitive parity with closed models.',
    whyItMatters: 'Gives the open-source developer ecosystem access to enterprise-grade frontier intelligence that can run privately on local or sovereign cloud clusters.',
    impactScore: 95,
    tags: ['Meta', 'Open Source', 'Llama 4', 'Local AI'],
  },
  {
    id: 'horizon-neurips-2026',
    title: 'NeurIPS 2026 Annual Research Conference',
    category: 'developer_event',
    categoryLabel: 'Research Summit',
    expectedTimeframe: 'December 2026',
    targetDateISO: '2026-12-08T00:00:00Z',
    organization: 'NeurIPS',
    status: 'Confirmed',
    statusColor: 'emerald',
    summary: 'World’s premiere neural information processing and machine learning research gathering, featuring thousands of peer-reviewed breakthroughs.',
    whyItMatters: 'Where labs debut next-generation architectures, safety breakthroughs, and post-transformer neural network designs.',
    impactScore: 88,
    tags: ['NeurIPS', 'Research', 'Academic', 'Machine Learning'],
  },
];

export async function getUpcomingHorizonEvents(): Promise<HorizonEvent[]> {
  return UPCOMING_HORIZON_EVENTS;
}
