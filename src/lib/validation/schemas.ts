// =============================================================================
// AI Radar — Zod Validation Schemas
// =============================================================================
// Validates data entering database service and repository boundaries.
// External source records, user inputs, and diagnostic data must be validated
// before insertion or query.
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export const SourceTypeEnum = z.enum([
  'official_company',
  'research',
  'repository',
  'community',
  'news',
  'regulatory',
  'safety',
  'database',
  'other',
]);

export const ItemTypeEnum = z.enum([
  'announcement',
  'research_paper',
  'model_release',
  'tool_release',
  'repository',
  'tutorial',
  'company_update',
  'funding',
  'product_update',
  'security_event',
  'regulation',
  'policy_update',
  'career_signal',
  'other',
]);

export const CollectionRunStatusEnum = z.enum([
  'running',
  'completed',
  'failed',
  'partial',
]);

export const TrustLevelEnum = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

// ---------------------------------------------------------------------------
// Source Schemas
// ---------------------------------------------------------------------------

export const CreateSourceSchema = z.object({
  name: z.string().min(1, 'Source name is required').max(200),
  source_type: SourceTypeEnum,
  base_url: z.string().url('Must be a valid URL'),
  feed_url: z.string().url('Must be a valid URL').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  trust_level: TrustLevelEnum.optional().default(2),
  active: z.boolean().optional().default(true),
  config: z.record(z.string(), z.unknown()).optional().default({}) as z.ZodType<Record<string, unknown>>,
});

export const UpdateSourceSchema = CreateSourceSchema.partial();

export type CreateSourceInput = z.input<typeof CreateSourceSchema>;
export type UpdateSourceInput = z.input<typeof UpdateSourceSchema>;

// ---------------------------------------------------------------------------
// Item Schemas
// ---------------------------------------------------------------------------

export const CreateItemSchema = z.object({
  source_id: z.string().uuid('Invalid source ID format'),
  external_id: z.string().max(500).optional().nullable(),
  canonical_url: z.string().url('Canonical URL must be a valid URL'),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional().nullable(),
  content_text: z.string().max(20000).optional().nullable(),
  authors: z.array(z.string().max(200)).optional().default([]),
  item_type: ItemTypeEnum,
  published_at: z.string().datetime().optional().nullable(),
  discovered_at: z.string().datetime().optional(),
  content_hash: z.string().length(64).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}) as z.ZodType<Record<string, unknown>>,
  category_slugs: z.array(z.string().min(1)).optional().default([]),
});

export const UpdateItemSchema = CreateItemSchema.partial().omit({
  source_id: true,
  canonical_url: true,
});

export type CreateItemInput = z.input<typeof CreateItemSchema>;
export type UpdateItemInput = z.input<typeof UpdateItemSchema>;

// ---------------------------------------------------------------------------
// Bookmark Schemas
// ---------------------------------------------------------------------------

export const CreateBookmarkSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  item_id: z.string().min(1, 'Item ID is required'),
});

export const RemoveBookmarkSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  item_id: z.string().min(1, 'Item ID is required'),
});

export type CreateBookmarkInput = z.input<typeof CreateBookmarkSchema>;
export type RemoveBookmarkInput = z.input<typeof RemoveBookmarkSchema>;

// ---------------------------------------------------------------------------
// Collection Run Schemas
// ---------------------------------------------------------------------------

export const CreateCollectionRunSchema = z.object({
  source_id: z.string().uuid('Invalid source ID'),
  status: CollectionRunStatusEnum.optional().default('running'),
  started_at: z.string().datetime().optional(),
  items_discovered: z.number().int().nonnegative().optional().default(0),
  items_created: z.number().int().nonnegative().optional().default(0),
  items_updated: z.number().int().nonnegative().optional().default(0),
  errors: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}) as z.ZodType<Record<string, unknown>>,
});

export const UpdateCollectionRunSchema = z.object({
  status: CollectionRunStatusEnum.optional(),
  finished_at: z.string().datetime().optional().nullable(),
  items_discovered: z.number().int().nonnegative().optional(),
  items_created: z.number().int().nonnegative().optional(),
  items_updated: z.number().int().nonnegative().optional(),
  errors: z.array(z.record(z.string(), z.unknown())).optional(),
  metadata: z.record(z.string(), z.unknown()).optional() as z.ZodType<Record<string, unknown> | undefined>,
});

export type CreateCollectionRunInput = z.input<typeof CreateCollectionRunSchema>;
export type UpdateCollectionRunInput = z.input<typeof UpdateCollectionRunSchema>;

// ---------------------------------------------------------------------------
// Summary & AI Enrichment Schemas (Phase 4)
// ---------------------------------------------------------------------------

export const ClaimConfidenceEnum = z.enum(['high', 'medium', 'low']);
export const ClaimImportanceEnum = z.enum(['critical', 'high', 'moderate', 'low']);

export const ClaimItemSchema = z.object({
  text: z.string().min(1, 'Claim text is required'),
  claim_type: z.string().optional().default('finding'),
  is_direct_quote: z.boolean().optional().default(false),
  confidence: z.union([z.number().min(0).max(1), ClaimConfidenceEnum]).optional().default('high'),
  importance: ClaimImportanceEnum.optional().default('moderate'),
  source_support: z.string().optional(),
});

export const EntityItemSchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  type: z.string().min(1, 'Entity type is required'),
});

export const CreateSummarySchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  model_name: z.string().min(1).max(100),
  provider: z.string().min(1).max(100),
  summary: z.string().min(1).max(5000),
  key_points: z.array(z.string()).optional().default([]),
  significance: z.string().max(2000).optional().nullable(),
  claims: z.array(ClaimItemSchema).optional().default([]),
  confidence: z.number().min(0).max(1).optional().nullable(),
  entities: z.array(EntityItemSchema).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  topics: z.array(z.string()).optional().default([]),
  suggested_categories: z.array(z.string()).optional().default([]),
  suggested_item_type: z.string().optional().nullable(),
  prompt_version: z.string().optional().default('1.0.0'),
  warning_flags: z.array(z.string()).optional().default([]),
  usage: z.record(z.string(), z.unknown()).optional().default({}) as z.ZodType<Record<string, unknown>>,
});

export type CreateSummaryInput = z.input<typeof CreateSummarySchema>;

/**
 * Validates the raw JSON output from the AI provider before saving.
 */
export const AIEnrichmentOutputSchema = z.object({
  summary: z.string().min(10, 'Summary must be substantive').max(4000),
  key_points: z.array(z.string().min(3)).min(1).max(10),
  significance: z.string().max(2000).optional().nullable(),
  claims: z.array(ClaimItemSchema).optional().default([]),
  entities: z.array(EntityItemSchema).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  topics: z.array(z.string()).optional().default([]),
  suggested_categories: z.array(z.string()).optional().default([]),
  suggested_item_type: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().default(0.85),
  warning_flags: z.array(z.string()).optional().default([]),
});

export type AIEnrichmentOutput = z.infer<typeof AIEnrichmentOutputSchema>;

// ---------------------------------------------------------------------------
// Query & Filter Schemas
// ---------------------------------------------------------------------------

export const ItemsQueryFilterSchema = z.object({
  categorySlug: z.string().optional(),
  itemType: ItemTypeEnum.optional(),
  sourceId: z.string().uuid().optional(),
  searchQuery: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ItemsQueryFilter = z.infer<typeof ItemsQueryFilterSchema>;

// ---------------------------------------------------------------------------
// Phase 5 Intelligence Schemas
// ---------------------------------------------------------------------------

export const TrendStatusEnum = z.enum([
  'early_signal',
  'developing',
  'established',
  'uncertain',
  'declining',
  'inactive',
]);

export const TrendConfidenceEnum = z.enum(['high', 'medium', 'low']);

export const EvidenceRelationshipTypeEnum = z.enum([
  'supporting',
  'related',
  'contradictory',
  'background',
]);

export const EvidenceStrengthEnum = z.enum(['strong', 'moderate', 'weak']);

export const CreateTrendSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  slug: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  status: TrendStatusEnum.default('early_signal'),
  confidence: TrendConfidenceEnum.default('medium'),
  confidence_score: z.number().min(0).max(1).default(0.5),
  summary: z.string().max(5000).optional().nullable(),
  why_it_matters: z.string().max(3000).optional().nullable(),
  what_to_watch: z.string().max(3000).optional().nullable(),
  technologies: z.array(z.string()).default([]),
  entities: z.array(z.record(z.string(), z.unknown())).default([]),
  topics: z.array(z.string()).default([]),
  distinct_source_count: z.number().int().nonnegative().default(1),
  item_count: z.number().int().nonnegative().default(1),
  activity_change_pct: z.number().default(0),
  timeline: z.array(z.record(z.string(), z.unknown())).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateTrendInput = z.infer<typeof CreateTrendSchema>;

export const CreateTrendEvidenceSchema = z.object({
  trend_id: z.string().uuid('Invalid trend ID'),
  item_id: z.string().uuid('Invalid item ID'),
  relationship_type: EvidenceRelationshipTypeEnum.default('supporting'),
  evidence_strength: EvidenceStrengthEnum.default('moderate'),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateTrendEvidenceInput = z.infer<typeof CreateTrendEvidenceSchema>;

export const BriefingSectionItemSchema = z.object({
  itemId: z.string(),
  title: z.string(),
  takeaway: z.string(),
  sourceName: z.string(),
  url: z.string(),
});

export const BriefingSectionSchema = z.object({
  title: z.string(),
  categorySlug: z.string(),
  summary: z.string(),
  items: z.array(BriefingSectionItemSchema),
});

export const CreateDailyBriefingSchema = z.object({
  briefing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(5000),
  sections: z.array(BriefingSectionSchema).default([]),
  top_signals: z.array(z.record(z.string(), z.unknown())).default([]),
  item_count: z.number().int().nonnegative().default(0),
  model: z.string().max(100).default('default'),
  provider: z.string().max(100).default('ai-radar'),
  prompt_version: z.string().max(50).default('1.0.0'),
});

export type CreateDailyBriefingInput = z.infer<typeof CreateDailyBriefingSchema>;

export const UserPreferencesSchema = z
  .object({
    topics: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    interest_level: z.record(z.string(), z.enum(['high', 'medium', 'low'])).optional(),
    interestLevel: z.record(z.string(), z.enum(['high', 'medium', 'low'])).optional(),
  })
  .transform((data) => ({
    topics: data.topics,
    categories: data.categories,
    interest_level: data.interest_level || data.interestLevel || {},
    interestLevel: data.interestLevel || data.interest_level || {},
  }));

export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;

// ---------------------------------------------------------------------------
// Phase 6 Personal Intelligence Schemas
// ---------------------------------------------------------------------------

export const ExperienceLevelEnum = z.enum([
  'beginner',
  'developing',
  'intermediate',
  'advanced',
]);

export const SkillProficiencyEnum = z.enum([
  'interested',
  'beginner',
  'intermediate',
  'advanced',
]);

export const UserSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
  level: SkillProficiencyEnum.default('intermediate'),
  category: z.string().max(100).optional(),
});

export const UserProfileSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  experience_level: ExperienceLevelEnum.default('intermediate'),
  primary_role_interest: z.string().min(1, 'Primary role interest is required').max(100).default('AI / Full Stack Engineer'),
  secondary_role_interests: z.array(z.string().max(100)).default([]),
  skills: z.array(UserSkillSchema).default([]),
  technologies: z.array(z.string().max(100)).default([]),
  career_goals: z.array(z.string().max(300)).default([]),
  learning_goals: z.array(z.string().max(300)).default([]),
  project_interests: z.array(z.string().max(300)).default([]),
  preferred_topics: z.array(z.string().max(100)).default([]),
  excluded_topics: z.array(z.string().max(100)).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const UpdateUserProfileSchema = UserProfileSchema.partial();
export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

export const CareerSignalTypeEnum = z.enum([
  'emerging_role',
  'increasing_demand',
  'architectural_shift',
  'workflow_shift',
]);

export const CareerSignalStrengthEnum = z.enum(['strong', 'moderate', 'emerging']);

export const CreateCareerSignalSchema = z.object({
  role_or_domain: z.string().min(1).max(100),
  signal_type: CareerSignalTypeEnum.default('emerging_role'),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(3000),
  evidence_items: z.array(z.record(z.string(), z.unknown())).default([]),
  supporting_trends: z.array(z.record(z.string(), z.unknown())).default([]),
  technologies: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  strength: CareerSignalStrengthEnum.default('moderate'),
  why_it_matters: z.string().max(2000).optional().nullable(),
  source_types: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateCareerSignalInput = z.infer<typeof CreateCareerSignalSchema>;

export const SkillGapTypeEnum = z.enum(['untracked', 'level_up', 'emerging']);
export const SkillGapActionStatusEnum = z.enum([
  'active',
  'saved',
  'dismissed',
  'in_progress',
  'completed',
]);

export const CreateSkillGapSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  skill_name: z.string().min(1).max(100),
  skill_category: z.string().max(100).default('Core AI / ML'),
  relevance_reason: z.string().min(1).max(1000),
  gap_type: SkillGapTypeEnum.default('untracked'),
  target_role: z.string().max(100).optional().nullable(),
  associated_technologies: z.array(z.string()).default([]),
  supporting_items: z.array(z.record(z.string(), z.unknown())).default([]),
  supporting_trends: z.array(z.record(z.string(), z.unknown())).default([]),
  learning_path: z.array(z.record(z.string(), z.unknown())).default([]),
  user_action_status: SkillGapActionStatusEnum.default('active'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateSkillGapInput = z.infer<typeof CreateSkillGapSchema>;

export const ProjectOpportunityDifficultyEnum = z.enum([
  'small',
  'medium',
  'large',
  'advanced',
]);

export const ProjectOpportunityStatusEnum = z.enum([
  'active',
  'saved',
  'dismissed',
  'in_progress',
  'built',
]);

export const CreateProjectOpportunitySchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300),
  problem_statement: z.string().min(1).max(2000),
  target_user: z.string().min(1).max(300),
  proposed_solution: z.string().min(1).max(3000),
  why_now: z.string().min(1).max(1500),
  difficulty: ProjectOpportunityDifficultyEnum.default('medium'),
  technical_stack: z.array(z.string()).default([]),
  required_skills: z.array(z.string()).default([]),
  skills_matched: z.array(z.string()).default([]),
  skills_to_learn: z.array(z.string()).default([]),
  implementation_steps: z.array(z.record(z.string(), z.unknown())).default([]),
  potential_challenges: z.array(z.string()).default([]),
  evidence_items: z.array(z.record(z.string(), z.unknown())).default([]),
  related_trend_slugs: z.array(z.string()).default([]),
  user_status: ProjectOpportunityStatusEnum.default('active'),
  user_notes: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateProjectOpportunityInput = z.infer<typeof CreateProjectOpportunitySchema>;

export const CreateLearningTopicSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300),
  category: z.string().max(100).default('AI Engineering'),
  summary: z.string().min(1).max(2000),
  why_relevant: z.string().min(1).max(1500),
  prerequisites: z.array(z.string()).default([]),
  key_concepts: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  related_items: z.array(z.record(z.string(), z.unknown())).default([]),
  starter_project: z.string().max(500).optional().nullable(),
  advanced_project: z.string().max(500).optional().nullable(),
  user_status: z.enum(['active', 'saved', 'dismissed']).default('active'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateLearningTopicInput = z.infer<typeof CreateLearningTopicSchema>;

export const FeedbackEntityTypeEnum = z.enum([
  'item',
  'trend',
  'project',
  'skill_gap',
  'learning_topic',
  'career_signal',
]);

export const FeedbackTypeEnum = z.enum([
  'useful',
  'not_relevant',
  'already_know',
  'interested',
  'dismissed',
  'saved',
  'incorrect',
  'duplicate',
  'missing_source',
  'poor_summary',
  'bad_recommendation',
  'technical_issue',
  'billing_issue',
]);

export const CreateUserFeedbackSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  entity_type: FeedbackEntityTypeEnum,
  entity_id: z.string().min(1),
  feedback_type: FeedbackTypeEnum,
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateUserFeedbackInput = z.infer<typeof CreateUserFeedbackSchema>;

// ---------------------------------------------------------------------------
// Phase 7 — Multi-User, Auth, Onboarding & Commercial Schemas
// ---------------------------------------------------------------------------

export const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().max(100).optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof SignInSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const OnboardingSchema = z.object({
  name: z.string().max(100).optional(),
  experience_level: ExperienceLevelEnum.optional().default('intermediate'),
  interests: z.array(z.string()).optional().default([]),
  career_interests: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  learning_goals: z.array(z.string()).optional().default([]),
  project_interests: z.array(z.string()).optional().default([]),
  preferred_categories: z.array(z.string()).optional().default([]),
  skipped: z.boolean().optional().default(false),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export const TrackedTopicSchema = z.object({
  topic: z.string().min(1, 'Topic name is required').max(100),
  category: z.string().max(100).optional().nullable(),
});

export type TrackedTopicInput = z.infer<typeof TrackedTopicSchema>;

export const SavedIntelligenceSchema = z.object({
  entity_type: z.enum(['item', 'trend', 'project', 'skill_gap', 'learning_topic', 'tool']),
  entity_id: z.string().min(1),
  title: z.string().min(1).max(300),
  notes: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type SavedIntelligenceInput = z.infer<typeof SavedIntelligenceSchema>;

export const AnalyticsEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
});

export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>;

