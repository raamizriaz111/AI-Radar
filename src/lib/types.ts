// AI Radar — Core TypeScript Types
// These types define the shape of future real data from the database.
// Phase 1 does not populate these with real data — they prepare
// the codebase for Phase 2 (database) and beyond.

export type ContentType =
  | 'news'
  | 'paper'
  | 'tool'
  | 'model'
  | 'release'
  | 'regulation'
  | 'discussion'
  | 'blog';

export type Category =
  | 'ai-news'
  | 'ai-tools'
  | 'models'
  | 'research'
  | 'coding-agents'
  | 'emerging-trends'
  | 'career'
  | 'business'
  | 'safety-regulation';

export type TrendStatus =
  | 'early_signal'
  | 'developing'
  | 'established'
  | 'uncertain'
  | 'declining'
  | 'inactive'
  | 'early-signal';

export type CollectionStatus = 'idle' | 'running' | 'success' | 'error';

export type StatusType = 'idle' | 'running' | 'success' | 'error' | 'warning' | 'offline';

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------

export interface Source {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  enabled: boolean;
  lastCollectedAt?: string | null;
}

// ---------------------------------------------------------------------------
// Intelligence Items
// ---------------------------------------------------------------------------

export interface IntelligenceItem {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  externalId?: string | null;
  canonicalUrl: string;
  title: string;
  description?: string | null;
  author?: string | null;
  publishedAt: string;
  discoveredAt: string;
  contentType: ContentType;
  categories: Category[];
  language?: string | null;
  isBookmarked?: boolean;
}

export interface ExtractedClaim {
  text: string;
  claim_type?: string;
  is_direct_quote?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  importance?: 'critical' | 'high' | 'moderate' | 'low';
  source_support?: string;
}

export interface ExtractedEntity {
  name: string;
  type: string;
}

export interface Summary {
  id: string;
  itemId: string;
  content: string;
  model: string;
  provider: string;
  generatedAt: string;
  version: number;
  keyPoints?: string[];
  significance?: string | null;
  claims?: ExtractedClaim[];
  entities?: ExtractedEntity[];
  technologies?: string[];
  topics?: string[];
  confidence?: number | null;
  promptVersion?: string;
  warningFlags?: string[];
}

export interface IntelligenceItemWithSummary extends IntelligenceItem {
  summary?: Summary | null;
}

// ---------------------------------------------------------------------------
// Trends (Phase 5)
// ---------------------------------------------------------------------------

export interface Trend {
  id: string;
  title: string;
  slug?: string;
  description: string;
  status: TrendStatus;
  confidence?: 'low' | 'medium' | 'high';
  confidenceScore?: number;
  summary?: string | null;
  whyItMatters?: string | null;
  whatToWatch?: string | null;
  evidenceCount: number;
  distinctSourceCount?: number;
  activityChangePct?: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  categories: Category[];
  technologies?: string[];
  entities?: Array<{ name: string; type: string }>;
  topics?: string[];
}

// ---------------------------------------------------------------------------
// Daily Intelligence Briefings (Phase 5)
// ---------------------------------------------------------------------------

export interface BriefingSectionItem {
  itemId?: string;
  title: string;
  takeaway: string;
  sourceName: string;
  url: string;
}

export interface BriefingSection {
  title: string;
  categorySlug?: string;
  summary: string;
  items: BriefingSectionItem[];
}

export interface DailyBriefing {
  id: string;
  briefingDate: string;
  title: string;
  summary: string;
  sections: BriefingSection[];
  topSignals: Array<{
    trendId?: string;
    title: string;
    status: TrendStatus;
    reason: string;
  }>;
  itemCount: number;
  model: string;
  provider: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// User Preferences (Phase 5)
// ---------------------------------------------------------------------------

export interface UserPreferences {
  topics: string[];
  categories: Category[];
  interestLevel: Record<string, 'high' | 'medium' | 'low'>;
}

// ---------------------------------------------------------------------------
// Collection runs (diagnostics)
// ---------------------------------------------------------------------------

export interface CollectionRun {
  id: string;
  sourceId: string;
  sourceName: string;
  startedAt: string;
  finishedAt?: string | null;
  status: CollectionStatus;
  recordsFetched: number;
  recordsNew: number;
  recordsUpdated: number;
  recordsDuplicate: number;
  errorMessage?: string | null;
}

// ---------------------------------------------------------------------------
// Phase 6 Personal Intelligence & Career Types
// ---------------------------------------------------------------------------

export type ExperienceLevel = 'beginner' | 'developing' | 'intermediate' | 'advanced';
export type SkillProficiency = 'interested' | 'beginner' | 'intermediate' | 'advanced';

export interface UserSkill {
  name: string;
  level: SkillProficiency;
  category?: string;
}

export interface UserProfile {
  id: string;
  userId?: string | null;
  name?: string | null;
  experienceLevel: ExperienceLevel;
  primaryRoleInterest: string;
  secondaryRoleInterests: string[];
  skills: UserSkill[];
  technologies: string[];
  careerGoals: string[];
  learningGoals: string[];
  projectInterests: string[];
  preferredTopics: string[];
  excludedTopics: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type CareerSignalType =
  | 'emerging_role'
  | 'increasing_demand'
  | 'architectural_shift'
  | 'workflow_shift';

export type CareerSignalStrength = 'strong' | 'moderate' | 'emerging';

export interface CareerSignal {
  id: string;
  roleOrDomain: string;
  signalType: CareerSignalType;
  title: string;
  description: string;
  evidenceItems: Array<{ id: string; title: string; url: string; sourceName: string }>;
  supportingTrends: Array<{ id: string; title: string; slug: string }>;
  technologies: string[];
  skills: string[];
  strength: CareerSignalStrength;
  whyItMatters?: string | null;
  sourceTypes: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type SkillGapType = 'untracked' | 'level_up' | 'emerging';
export type SkillGapActionStatus = 'active' | 'saved' | 'dismissed' | 'in_progress' | 'completed';

export interface SkillGapLearningStep {
  step: number;
  title: string;
  description: string;
  resourceType?: string;
}

export interface SkillGap {
  id: string;
  userId?: string | null;
  skillName: string;
  skillCategory: string;
  relevanceReason: string;
  gapType: SkillGapType;
  targetRole?: string | null;
  associatedTechnologies: string[];
  supportingItems: Array<{ id: string; title: string; url: string }>;
  supportingTrends: Array<{ id: string; title: string; slug: string }>;
  learningPath: SkillGapLearningStep[];
  userActionStatus: SkillGapActionStatus;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectOpportunityDifficulty = 'small' | 'medium' | 'large' | 'advanced';
export type ProjectOpportunityStatus = 'active' | 'saved' | 'dismissed' | 'in_progress' | 'built';

export interface ProjectOpportunityStep {
  step: number;
  title: string;
  detail: string;
}

export interface ProjectOpportunity {
  id: string;
  title: string;
  slug: string;
  problemStatement: string;
  targetUser: string;
  proposedSolution: string;
  whyNow: string;
  difficulty: ProjectOpportunityDifficulty;
  technicalStack: string[];
  requiredSkills: string[];
  skillsMatched: string[];
  skillsToLearn: string[];
  implementationSteps: ProjectOpportunityStep[];
  potentialChallenges: string[];
  evidenceItems: Array<{ id: string; title: string; url: string; sourceName: string }>;
  relatedTrendSlugs: string[];
  userStatus: ProjectOpportunityStatus;
  userNotes?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  whyRelevant: string;
  prerequisites: string[];
  keyConcepts: string[];
  technologies: string[];
  relatedItems: Array<{ id: string; title: string; url: string }>;
  starterProject?: string | null;
  advancedProject?: string | null;
  userStatus: 'active' | 'saved' | 'dismissed';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserIntelligenceFeedback {
  id: string;
  userId?: string | null;
  entityType: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'career_signal';
  entityId: string;
  feedbackType:
    | 'useful'
    | 'not_relevant'
    | 'already_know'
    | 'interested'
    | 'dismissed'
    | 'saved'
    | 'incorrect'
    | 'duplicate'
    | 'missing_source'
    | 'poor_summary'
    | 'bad_recommendation'
    | 'technical_issue'
    | 'billing_issue';
  notes?: string | null;
  createdAt?: string;
}

export interface PersonalRelevanceMatch {
  score: number; // 0 - 100
  matchedSkills: string[];
  matchedTechnologies: string[];
  matchedGoals: string[];
  matchedRoles: string[];
  reasons: string[];
  isExcluded: boolean;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  items: IntelligenceItemWithSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Category metadata — used for navigation and display
// ---------------------------------------------------------------------------

export interface CategoryInfo {
  id: Category;
  label: string;
  description: string;
  href: string;
  iconName: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'ai-news',
    label: 'AI News',
    description: 'Announcements, releases, and industry developments',
    href: '/news',
    iconName: 'Newspaper',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    description: 'New and notable AI-powered tools and applications',
    href: '/tools',
    iconName: 'Wrench',
  },
  {
    id: 'models',
    label: 'Models',
    description: 'Foundation models, benchmarks, and capability updates',
    href: '/research',
    iconName: 'FlaskConical',
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Academic papers and technical publications',
    href: '/research',
    iconName: 'BookOpen',
  },
  {
    id: 'coding-agents',
    label: 'Coding Agents',
    description: 'AI coding assistants, agent frameworks, and automation',
    href: '/coding-agents',
    iconName: 'Bot',
  },
  {
    id: 'emerging-trends',
    label: 'Emerging Trends',
    description: 'Recurring signals across research, products, and industry',
    href: '/trends',
    iconName: 'TrendingUp',
  },
  {
    id: 'career',
    label: 'Career & Projects',
    description: 'Skills, learning paths, and project ideas',
    href: '/career',
    iconName: 'GraduationCap',
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Customer problems and AI-enabled solutions',
    href: '/business',
    iconName: 'Briefcase',
  },
  {
    id: 'safety-regulation',
    label: 'Safety & Regulation',
    description: 'AI safety research, policy, and regulatory developments',
    href: '/safety',
    iconName: 'Shield',
  },
];

// ---------------------------------------------------------------------------
// Phase 7 — Multi-User Architecture & Commercial Foundation Types
// ---------------------------------------------------------------------------

export type PlanTier = 'free' | 'pro' | 'advanced' | 'team' | 'enterprise';

export interface UserPlan {
  id: string;
  userId: string;
  planTier: PlanTier;
  aiRequestsLimit: number;
  briefingsLimit: number;
  trackedTopicsLimit: number;
  features: {
    customTopics: boolean;
    export: boolean;
    earlyTrends: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type AiOperationType =
  | 'summary'
  | 'enrichment'
  | 'trend_detection'
  | 'briefing'
  | 'personal_relevance'
  | 'project_generation'
  | 'skill_analysis'
  | 'search';

export interface AiUsageLog {
  id: string;
  userId: string | null;
  operationType: AiOperationType;
  provider: string;
  model: string;
  promptVersion?: string | null;
  tokensUsed: number;
  isCached: boolean;
  status: 'success' | 'failure' | 'rate_limited';
  costEstimateUsd: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TrackedTopic {
  id: string;
  userId: string;
  topic: string;
  category?: string | null;
  createdAt?: string;
}

export type SavedEntityType =
  | 'item'
  | 'trend'
  | 'project'
  | 'skill_gap'
  | 'learning_topic'
  | 'tool';

export interface SavedIntelligence {
  id: string;
  userId: string;
  entityType: SavedEntityType;
  entityId: string;
  title: string;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface ProductAnalyticsEvent {
  id: string;
  userId?: string | null;
  eventName: string;
  properties?: Record<string, unknown>;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  error?: string;
}

