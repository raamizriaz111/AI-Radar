// =============================================================================
// AI Radar — Intelligence Layer Types (Phase 5)
// =============================================================================
// Type definitions for Signal Detection, Trend Clustering, Lifecycle,
// Importance Modeling, and Daily Briefings.
// =============================================================================

import type {
  TrendStatus,
  TrendConfidence,
  EvidenceRelationshipType,
  EvidenceStrength,
  ItemFull,
} from '@/lib/database.types';
import type { UserPreferences } from '@/lib/types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  topics: ['LLMs', 'AI Agents', 'Models & Research', 'Inference & Serving', 'Safety & Regulation', 'Developer Tools'],
  categories: ['models', 'coding-agents', 'ai-tools', 'ai-news', 'safety-regulation'],
  interestLevel: {
    'AI Agents': 'high',
    'LLMs': 'high',
    'Models & Research': 'high',
    'Inference & Serving': 'medium',
    'Safety & Regulation': 'medium',
    'Developer Tools': 'medium',
  },
};

export interface DetectedSignal {
  id: string;
  topic: string;
  technologyOrEntity: string;
  kind: 'technology' | 'topic' | 'entity' | 'cross_category';
  itemCount: number;
  distinctSourceCount: number;
  sources: string[];
  categories: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  activityChangePct: number;
  recentItems: ItemFull[];
  hasContradictions: boolean;
  contradictionNotes?: string;
}

export interface TrendCandidate {
  title: string;
  slug: string;
  description: string;
  status: TrendStatus;
  confidence: TrendConfidence;
  confidenceScore: number;
  summary: string;
  whyItMatters: string;
  whatToWatch: string;
  technologies: string[];
  entities: Array<{ name: string; type: string }>;
  topics: string[];
  distinctSourceCount: number;
  itemCount: number;
  activityChangePct: number;
  timeline: Array<{
    date: string;
    title: string;
    sourceName: string;
    itemId?: string;
    takeaway: string;
  }>;
  evidence: Array<{
    item: ItemFull;
    relationshipType: EvidenceRelationshipType;
    evidenceStrength: EvidenceStrength;
    notes?: string;
  }>;
}

export interface ImportanceScores {
  recencyScore: number;
  sourceTrustScore: number;
  evidenceBreadthScore: number;
  userRelevanceScore: number;
  totalScore: number;
}

export interface RankedItem {
  item: ItemFull;
  importance: ImportanceScores;
  matchedTopics: string[];
}

export interface BriefingSectionItemPayload {
  itemId: string;
  title: string;
  takeaway: string;
  sourceName: string;
  url: string;
}

export interface BriefingSectionPayload {
  title: string;
  categorySlug: string;
  summary: string;
  items: BriefingSectionItemPayload[];
}

export interface GeneratedBriefing {
  briefingDate: string;
  title: string;
  summary: string;
  sections: BriefingSectionPayload[];
  topSignals: Array<{
    trendId?: string;
    title: string;
    status: TrendStatus;
    reason: string;
  }>;
  itemCount: number;
  model: string;
  provider: string;
  promptVersion: string;
}
