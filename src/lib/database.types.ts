// =============================================================================
// AI Radar — Supabase Database Types
// =============================================================================
// These types mirror the PostgreSQL schema defined in supabase/migrations/.
// Keep in sync with the database manually until the Supabase CLI is set up
// to generate types automatically (supabase gen types typescript).
//
// Naming convention:
//   Database — the root type (passed to createClient generic)
//   Tables[T]['Row'] — select result type
//   Tables[T]['Insert'] — insert parameter type
//   Tables[T]['Update'] — update parameter type
//   Tables[T]['Relationships'] — foreign key relationship metadata
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          updated_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          name: string;
          source_type: SourceType;
          base_url: string;
          feed_url: string | null;
          description: string | null;
          trust_level: 1 | 2 | 3;
          active: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          source_type: SourceType;
          base_url: string;
          feed_url?: string | null;
          description?: string | null;
          trust_level?: 1 | 2 | 3;
          active?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          source_type?: SourceType;
          base_url?: string;
          feed_url?: string | null;
          description?: string | null;
          trust_level?: 1 | 2 | 3;
          active?: boolean;
          config?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          label: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          slug?: string;
          label?: string;
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          source_id: string;
          external_id: string | null;
          canonical_url: string;
          title: string;
          description: string | null;
          content_text: string | null;
          authors: Json;
          item_type: ItemType;
          published_at: string | null;
          discovered_at: string;
          content_hash: string | null;
          metadata: Json;
          enrichment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
          enrichment_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          external_id?: string | null;
          canonical_url: string;
          title: string;
          description?: string | null;
          content_text?: string | null;
          authors?: Json;
          item_type: ItemType;
          published_at?: string | null;
          discovered_at?: string;
          content_hash?: string | null;
          metadata?: Json;
          enrichment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
          enrichment_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          content_text?: string | null;
          authors?: Json;
          item_type?: ItemType;
          published_at?: string | null;
          content_hash?: string | null;
          metadata?: Json;
          enrichment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
          enrichment_error?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'items_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      item_categories: {
        Row: {
          item_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          item_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'item_categories_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'item_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      summaries: {
        Row: {
          id: string;
          item_id: string;
          model_name: string;
          provider: string;
          summary: string;
          key_points: Json;
          significance: string | null;
          claims: Json;
          confidence: number | null;
          entities: Json;
          technologies: Json;
          topics: Json;
          suggested_categories: Json;
          suggested_item_type: string | null;
          prompt_version: string;
          warning_flags: Json;
          usage: Json | null;
          generated_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          model_name: string;
          provider: string;
          summary: string;
          key_points?: Json;
          significance?: string | null;
          claims?: Json;
          confidence?: number | null;
          entities?: Json;
          technologies?: Json;
          topics?: Json;
          suggested_categories?: Json;
          suggested_item_type?: string | null;
          prompt_version?: string;
          warning_flags?: Json;
          usage?: Json | null;
          generated_at?: string;
          updated_at?: string;
        };
        Update: {
          summary?: string;
          key_points?: Json;
          significance?: string | null;
          claims?: Json;
          confidence?: number | null;
          entities?: Json;
          technologies?: Json;
          topics?: Json;
          suggested_categories?: Json;
          suggested_item_type?: string | null;
          prompt_version?: string;
          warning_flags?: Json;
          usage?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'summaries_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          }
        ];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          item_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          }
        ];
      };
      collection_runs: {
        Row: {
          id: string;
          source_id: string;
          status: CollectionRunStatus;
          started_at: string;
          finished_at: string | null;
          items_discovered: number;
          items_created: number;
          items_updated: number;
          errors: Json;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          status?: CollectionRunStatus;
          started_at?: string;
          finished_at?: string | null;
          items_discovered?: number;
          items_created?: number;
          items_updated?: number;
          errors?: Json;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          status?: CollectionRunStatus;
          finished_at?: string | null;
          items_discovered?: number;
          items_created?: number;
          items_updated?: number;
          errors?: Json;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_runs_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      trends: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          status: TrendStatus;
          confidence: TrendConfidence;
          confidence_score: number;
          summary: string | null;
          why_it_matters: string | null;
          what_to_watch: string | null;
          timeline: Json;
          technologies: Json;
          entities: Json;
          topics: Json;
          distinct_source_count: number;
          item_count: number;
          activity_change_pct: number | null;
          first_detected_at: string;
          last_updated_at: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          status?: TrendStatus;
          confidence?: TrendConfidence;
          confidence_score?: number;
          summary?: string | null;
          why_it_matters?: string | null;
          what_to_watch?: string | null;
          timeline?: Json;
          technologies?: Json;
          entities?: Json;
          topics?: Json;
          distinct_source_count?: number;
          item_count?: number;
          activity_change_pct?: number | null;
          first_detected_at?: string;
          last_updated_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          status?: TrendStatus;
          confidence?: TrendConfidence;
          confidence_score?: number;
          summary?: string | null;
          why_it_matters?: string | null;
          what_to_watch?: string | null;
          timeline?: Json;
          technologies?: Json;
          entities?: Json;
          topics?: Json;
          distinct_source_count?: number;
          item_count?: number;
          activity_change_pct?: number | null;
          last_updated_at?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      trend_evidence: {
        Row: {
          id: string;
          trend_id: string;
          item_id: string;
          relationship_type: EvidenceRelationshipType;
          evidence_strength: EvidenceStrength;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trend_id: string;
          item_id: string;
          relationship_type?: EvidenceRelationshipType;
          evidence_strength?: EvidenceStrength;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          relationship_type?: EvidenceRelationshipType;
          evidence_strength?: EvidenceStrength;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trend_evidence_trend_id_fkey';
            columns: ['trend_id'];
            isOneToOne: false;
            referencedRelation: 'trends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trend_evidence_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          }
        ];
      };
      daily_briefings: {
        Row: {
          id: string;
          briefing_date: string;
          title: string;
          summary: string;
          sections: Json;
          top_signals: Json;
          item_count: number;
          model_name: string;
          provider: string;
          prompt_version: string;
          metadata: Json;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          briefing_date: string;
          title: string;
          summary: string;
          sections?: Json;
          top_signals?: Json;
          item_count?: number;
          model_name: string;
          provider: string;
          prompt_version?: string;
          metadata?: Json;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string;
          sections?: Json;
          top_signals?: Json;
          item_count?: number;
          model_name?: string;
          provider?: string;
          prompt_version?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string | null;
          topics: Json;
          categories: Json;
          interest_level: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          topics?: Json;
          categories?: Json;
          interest_level?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          topics?: Json;
          categories?: Json;
          interest_level?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          experience_level: 'beginner' | 'developing' | 'intermediate' | 'advanced';
          primary_role_interest: string;
          secondary_role_interests: Json;
          skills: Json;
          technologies: Json;
          career_goals: Json;
          learning_goals: Json;
          project_interests: Json;
          preferred_topics: Json;
          excluded_topics: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          experience_level?: 'beginner' | 'developing' | 'intermediate' | 'advanced';
          primary_role_interest?: string;
          secondary_role_interests?: Json;
          skills?: Json;
          technologies?: Json;
          career_goals?: Json;
          learning_goals?: Json;
          project_interests?: Json;
          preferred_topics?: Json;
          excluded_topics?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string | null;
          experience_level?: 'beginner' | 'developing' | 'intermediate' | 'advanced';
          primary_role_interest?: string;
          secondary_role_interests?: Json;
          skills?: Json;
          technologies?: Json;
          career_goals?: Json;
          learning_goals?: Json;
          project_interests?: Json;
          preferred_topics?: Json;
          excluded_topics?: Json;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      career_signals: {
        Row: {
          id: string;
          role_or_domain: string;
          signal_type: 'emerging_role' | 'increasing_demand' | 'architectural_shift' | 'workflow_shift';
          title: string;
          description: string;
          evidence_items: Json;
          supporting_trends: Json;
          technologies: Json;
          skills: Json;
          strength: 'strong' | 'moderate' | 'emerging';
          why_it_matters: string | null;
          source_types: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role_or_domain: string;
          signal_type: 'emerging_role' | 'increasing_demand' | 'architectural_shift' | 'workflow_shift';
          title: string;
          description: string;
          evidence_items?: Json;
          supporting_trends?: Json;
          technologies?: Json;
          skills?: Json;
          strength?: 'strong' | 'moderate' | 'emerging';
          why_it_matters?: string | null;
          source_types?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_or_domain?: string;
          signal_type?: 'emerging_role' | 'increasing_demand' | 'architectural_shift' | 'workflow_shift';
          title?: string;
          description?: string;
          evidence_items?: Json;
          supporting_trends?: Json;
          technologies?: Json;
          skills?: Json;
          strength?: 'strong' | 'moderate' | 'emerging';
          why_it_matters?: string | null;
          source_types?: Json;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      skill_gaps: {
        Row: {
          id: string;
          user_id: string | null;
          skill_name: string;
          skill_category: string;
          relevance_reason: string;
          gap_type: 'untracked' | 'level_up' | 'emerging';
          target_role: string | null;
          associated_technologies: Json;
          supporting_items: Json;
          supporting_trends: Json;
          learning_path: Json;
          user_action_status: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'completed';
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          skill_name: string;
          skill_category: string;
          relevance_reason: string;
          gap_type?: 'untracked' | 'level_up' | 'emerging';
          target_role?: string | null;
          associated_technologies?: Json;
          supporting_items?: Json;
          supporting_trends?: Json;
          learning_path?: Json;
          user_action_status?: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'completed';
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          skill_name?: string;
          skill_category?: string;
          relevance_reason?: string;
          gap_type?: 'untracked' | 'level_up' | 'emerging';
          target_role?: string | null;
          associated_technologies?: Json;
          supporting_items?: Json;
          supporting_trends?: Json;
          learning_path?: Json;
          user_action_status?: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'completed';
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_opportunities: {
        Row: {
          id: string;
          title: string;
          slug: string;
          problem_statement: string;
          target_user: string;
          proposed_solution: string;
          why_now: string;
          difficulty: 'small' | 'medium' | 'large' | 'advanced';
          technical_stack: Json;
          required_skills: Json;
          skills_matched: Json;
          skills_to_learn: Json;
          implementation_steps: Json;
          potential_challenges: Json;
          evidence_items: Json;
          related_trend_slugs: Json;
          user_status: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'built';
          user_notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          problem_statement: string;
          target_user: string;
          proposed_solution: string;
          why_now: string;
          difficulty?: 'small' | 'medium' | 'large' | 'advanced';
          technical_stack?: Json;
          required_skills?: Json;
          skills_matched?: Json;
          skills_to_learn?: Json;
          implementation_steps?: Json;
          potential_challenges?: Json;
          evidence_items?: Json;
          related_trend_slugs?: Json;
          user_status?: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'built';
          user_notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          problem_statement?: string;
          target_user?: string;
          proposed_solution?: string;
          why_now?: string;
          difficulty?: 'small' | 'medium' | 'large' | 'advanced';
          technical_stack?: Json;
          required_skills?: Json;
          skills_matched?: Json;
          skills_to_learn?: Json;
          implementation_steps?: Json;
          potential_challenges?: Json;
          evidence_items?: Json;
          related_trend_slugs?: Json;
          user_status?: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'built';
          user_notes?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_topics: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          summary: string;
          why_relevant: string;
          prerequisites: Json;
          key_concepts: Json;
          technologies: Json;
          related_items: Json;
          starter_project: string | null;
          advanced_project: string | null;
          user_status: 'active' | 'saved' | 'dismissed';
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category: string;
          summary: string;
          why_relevant: string;
          prerequisites?: Json;
          key_concepts?: Json;
          technologies?: Json;
          related_items?: Json;
          starter_project?: string | null;
          advanced_project?: string | null;
          user_status?: 'active' | 'saved' | 'dismissed';
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          category?: string;
          summary?: string;
          why_relevant?: string;
          prerequisites?: Json;
          key_concepts?: Json;
          technologies?: Json;
          related_items?: Json;
          starter_project?: string | null;
          advanced_project?: string | null;
          user_status?: 'active' | 'saved' | 'dismissed';
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_intelligence_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          entity_type: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'career_signal';
          entity_id: string;
          feedback_type: 'useful' | 'not_relevant' | 'already_know' | 'interested' | 'dismissed' | 'saved' | 'incorrect' | 'duplicate' | 'missing_source' | 'poor_summary' | 'bad_recommendation' | 'technical_issue' | 'billing_issue';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          entity_type: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'career_signal';
          entity_id: string;
          feedback_type: 'useful' | 'not_relevant' | 'already_know' | 'interested' | 'dismissed' | 'saved' | 'incorrect' | 'duplicate' | 'missing_source' | 'poor_summary' | 'bad_recommendation' | 'technical_issue' | 'billing_issue';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          entity_type?: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'career_signal';
          entity_id?: string;
          feedback_type?: 'useful' | 'not_relevant' | 'already_know' | 'interested' | 'dismissed' | 'saved' | 'incorrect' | 'duplicate' | 'missing_source' | 'poor_summary' | 'bad_recommendation' | 'technical_issue' | 'billing_issue';
          notes?: string | null;
        };
        Relationships: [];
      };
      user_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_tier: 'free' | 'pro' | 'advanced' | 'team' | 'enterprise';
          ai_requests_limit: number;
          briefings_limit: number;
          tracked_topics_limit: number;
          features: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_tier?: 'free' | 'pro' | 'advanced' | 'team' | 'enterprise';
          ai_requests_limit?: number;
          briefings_limit?: number;
          tracked_topics_limit?: number;
          features?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_tier?: 'free' | 'pro' | 'advanced' | 'team' | 'enterprise';
          ai_requests_limit?: number;
          briefings_limit?: number;
          tracked_topics_limit?: number;
          features?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          operation_type: 'summary' | 'enrichment' | 'trend_detection' | 'briefing' | 'personal_relevance' | 'project_generation' | 'skill_analysis' | 'search';
          provider: string;
          model: string;
          prompt_version: string | null;
          tokens_used: number;
          is_cached: boolean;
          status: 'success' | 'failure' | 'rate_limited';
          cost_estimate_usd: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          operation_type: 'summary' | 'enrichment' | 'trend_detection' | 'briefing' | 'personal_relevance' | 'project_generation' | 'skill_analysis' | 'search';
          provider: string;
          model: string;
          prompt_version?: string | null;
          tokens_used?: number;
          is_cached?: boolean;
          status?: 'success' | 'failure' | 'rate_limited';
          cost_estimate_usd?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          operation_type?: 'summary' | 'enrichment' | 'trend_detection' | 'briefing' | 'personal_relevance' | 'project_generation' | 'skill_analysis' | 'search';
          provider?: string;
          model?: string;
          prompt_version?: string | null;
          tokens_used?: number;
          is_cached?: boolean;
          status?: 'success' | 'failure' | 'rate_limited';
          cost_estimate_usd?: number;
          metadata?: Json;
        };
        Relationships: [];
      };
      user_tracked_topics: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          topic?: string;
          category?: string | null;
        };
        Relationships: [];
      };
      user_saved_intelligence: {
        Row: {
          id: string;
          user_id: string;
          entity_type: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'tool';
          entity_id: string;
          title: string;
          notes: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'tool';
          entity_id: string;
          title: string;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          entity_type?: 'item' | 'trend' | 'project' | 'skill_gap' | 'learning_topic' | 'tool';
          entity_id?: string;
          title?: string;
          notes?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      product_analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          properties: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          properties?: Json;
          created_at?: string;
        };
        Update: {
          event_name?: string;
          properties?: Json;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          description: string | null;
          price_monthly_usd: number;
          price_annual_usd: number | null;
          ai_requests_limit: number;
          briefings_limit: number;
          tracked_topics_limit: number;
          items_per_page_limit: number;
          features: Json;
          stripe_price_id_monthly: string | null;
          stripe_price_id_annual: string | null;
          sort_order: number;
          is_active: boolean;
          is_publicly_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          description?: string | null;
          price_monthly_usd?: number;
          price_annual_usd?: number | null;
          ai_requests_limit?: number;
          briefings_limit?: number;
          tracked_topics_limit?: number;
          items_per_page_limit?: number;
          features?: Json;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_annual?: string | null;
          sort_order?: number;
          is_active?: boolean;
          is_publicly_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          display_name?: string;
          description?: string | null;
          price_monthly_usd?: number;
          price_annual_usd?: number | null;
          ai_requests_limit?: number;
          briefings_limit?: number;
          tracked_topics_limit?: number;
          items_per_page_limit?: number;
          features?: Json;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_annual?: string | null;
          sort_order?: number;
          is_active?: boolean;
          is_publicly_visible?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_slug: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_start: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          billing_interval: string;
          provider: string | null;
          provider_subscription_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_slug: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          billing_interval?: string;
          provider?: string | null;
          provider_subscription_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_slug?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          billing_interval?: string;
          provider?: string | null;
          provider_subscription_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_customers: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_customer_id: string;
          email: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          provider_customer_id: string;
          email?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          provider_customer_id?: string;
          email?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          provider: string | null;
          provider_event_id: string | null;
          subscription_id: string | null;
          amount_usd: number | null;
          currency: string | null;
          status: string;
          raw_payload: Json;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          provider?: string | null;
          provider_event_id?: string | null;
          subscription_id?: string | null;
          amount_usd?: number | null;
          currency?: string | null;
          status?: string;
          raw_payload?: Json;
          processed_at?: string;
          created_at?: string;
        };
        Update: {
          event_type?: string;
          provider?: string | null;
          provider_event_id?: string | null;
          subscription_id?: string | null;
          amount_usd?: number | null;
          currency?: string | null;
          status?: string;
          raw_payload?: Json;
          processed_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          provider: string;
          provider_invoice_id: string | null;
          amount_due_usd: number;
          amount_paid_usd: number;
          currency: string;
          status: string;
          invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          provider?: string;
          provider_invoice_id?: string | null;
          amount_due_usd?: number;
          amount_paid_usd?: number;
          currency?: string;
          status?: string;
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subscription_id?: string | null;
          provider?: string;
          provider_invoice_id?: string | null;
          amount_due_usd?: number;
          amount_paid_usd?: number;
          currency?: string;
          status?: string;
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_periods: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          ai_requests_used: number;
          briefings_used: number;
          ai_requests_limit: number;
          briefings_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          ai_requests_used?: number;
          briefings_used?: number;
          ai_requests_limit?: number;
          briefings_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          period_start?: string;
          period_end?: string;
          ai_requests_used?: number;
          briefings_used?: number;
          ai_requests_limit?: number;
          briefings_limit?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      collection_run_status: CollectionRunStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ---------------------------------------------------------------------------
// Enum types — kept in sync with database CHECK constraints
// ---------------------------------------------------------------------------

export type SourceType =
  | 'official_company'
  | 'research'
  | 'repository'
  | 'community'
  | 'news'
  | 'regulatory'
  | 'safety'
  | 'database'
  | 'other';

export type ItemType =
  | 'announcement'
  | 'research_paper'
  | 'model_release'
  | 'tool_release'
  | 'repository'
  | 'tutorial'
  | 'company_update'
  | 'funding'
  | 'product_update'
  | 'security_event'
  | 'regulation'
  | 'policy_update'
  | 'career_signal'
  | 'other';

export type CollectionRunStatus = 'running' | 'completed' | 'failed' | 'partial';

export type TrendStatus =
  | 'early_signal'
  | 'developing'
  | 'established'
  | 'uncertain'
  | 'declining'
  | 'inactive';

export type TrendConfidence = 'low' | 'medium' | 'high';

export type EvidenceRelationshipType = 'supporting' | 'related' | 'contradictory' | 'background';

export type EvidenceStrength = 'strong' | 'moderate' | 'weak';

// ---------------------------------------------------------------------------
// Convenience row types (aliases for common use)
// ---------------------------------------------------------------------------

export type ProfileRow                  = Database['public']['Tables']['profiles']['Row'];
export type SourceRow                   = Database['public']['Tables']['sources']['Row'];
export type CategoryRow                 = Database['public']['Tables']['categories']['Row'];
export type ItemRow                     = Database['public']['Tables']['items']['Row'];
export type ItemCategoryRow             = Database['public']['Tables']['item_categories']['Row'];
export type SummaryRow                  = Database['public']['Tables']['summaries']['Row'];
export type BookmarkRow                 = Database['public']['Tables']['bookmarks']['Row'];
export type CollectionRunRow            = Database['public']['Tables']['collection_runs']['Row'];
export type TrendRow                    = Database['public']['Tables']['trends']['Row'];
export type TrendEvidenceRow            = Database['public']['Tables']['trend_evidence']['Row'];
export type DailyBriefingRow            = Database['public']['Tables']['daily_briefings']['Row'];
export type UserPreferencesRow          = Database['public']['Tables']['user_preferences']['Row'];
export type UserProfileRow              = Database['public']['Tables']['user_profiles']['Row'];
export type CareerSignalRow             = Database['public']['Tables']['career_signals']['Row'];
export type SkillGapRow                 = Database['public']['Tables']['skill_gaps']['Row'];
export type ProjectOpportunityRow       = Database['public']['Tables']['project_opportunities']['Row'];
export type LearningTopicRow            = Database['public']['Tables']['learning_topics']['Row'];
export type UserIntelligenceFeedbackRow = Database['public']['Tables']['user_intelligence_feedback']['Row'];
export type UserPlanRow                 = Database['public']['Tables']['user_plans']['Row'];
export type AiUsageLogRow               = Database['public']['Tables']['ai_usage_logs']['Row'];
export type UserTrackedTopicRow         = Database['public']['Tables']['user_tracked_topics']['Row'];
export type UserSavedIntelligenceRow    = Database['public']['Tables']['user_saved_intelligence']['Row'];
export type ProductAnalyticsEventRow    = Database['public']['Tables']['product_analytics_events']['Row'];

// Insert types
export type InsertSource                   = Database['public']['Tables']['sources']['Insert'];
export type InsertItem                     = Database['public']['Tables']['items']['Insert'];
export type InsertBookmark                 = Database['public']['Tables']['bookmarks']['Insert'];
export type InsertCollectionRun            = Database['public']['Tables']['collection_runs']['Insert'];
export type InsertSummary                  = Database['public']['Tables']['summaries']['Insert'];
export type InsertTrend                    = Database['public']['Tables']['trends']['Insert'];
export type InsertTrendEvidence            = Database['public']['Tables']['trend_evidence']['Insert'];
export type InsertDailyBriefing            = Database['public']['Tables']['daily_briefings']['Insert'];
export type InsertUserPreferences          = Database['public']['Tables']['user_preferences']['Insert'];
export type InsertUserProfile              = Database['public']['Tables']['user_profiles']['Insert'];
export type InsertCareerSignal             = Database['public']['Tables']['career_signals']['Insert'];
export type InsertSkillGap                 = Database['public']['Tables']['skill_gaps']['Insert'];
export type InsertProjectOpportunity       = Database['public']['Tables']['project_opportunities']['Insert'];
export type InsertLearningTopic            = Database['public']['Tables']['learning_topics']['Insert'];
export type InsertUserIntelligenceFeedback = Database['public']['Tables']['user_intelligence_feedback']['Insert'];
export type InsertUserPlan                 = Database['public']['Tables']['user_plans']['Insert'];
export type InsertAiUsageLog               = Database['public']['Tables']['ai_usage_logs']['Insert'];
export type InsertUserTrackedTopic         = Database['public']['Tables']['user_tracked_topics']['Insert'];
export type InsertUserSavedIntelligence    = Database['public']['Tables']['user_saved_intelligence']['Insert'];
export type InsertProductAnalyticsEvent    = Database['public']['Tables']['product_analytics_events']['Insert'];

// Update types
export type UpdateItem                     = Database['public']['Tables']['items']['Update'];
export type UpdateCollectionRun            = Database['public']['Tables']['collection_runs']['Update'];
export type UpdateTrend                    = Database['public']['Tables']['trends']['Update'];
export type UpdateDailyBriefing            = Database['public']['Tables']['daily_briefings']['Update'];
export type UpdateUserPreferences          = Database['public']['Tables']['user_preferences']['Update'];
export type UpdateUserProfile              = Database['public']['Tables']['user_profiles']['Update'];
export type UpdateCareerSignal             = Database['public']['Tables']['career_signals']['Update'];
export type UpdateSkillGap                 = Database['public']['Tables']['skill_gaps']['Update'];
export type UpdateProjectOpportunity       = Database['public']['Tables']['project_opportunities']['Update'];
export type UpdateLearningTopic            = Database['public']['Tables']['learning_topics']['Update'];
export type UpdateUserIntelligenceFeedback = Database['public']['Tables']['user_intelligence_feedback']['Update'];
export type UpdateUserPlan                 = Database['public']['Tables']['user_plans']['Update'];
export type UpdateAiUsageLog               = Database['public']['Tables']['ai_usage_logs']['Update'];
export type UpdateUserTrackedTopic         = Database['public']['Tables']['user_tracked_topics']['Update'];
export type UpdateUserSavedIntelligence    = Database['public']['Tables']['user_saved_intelligence']['Update'];
export type UpdateProductAnalyticsEvent    = Database['public']['Tables']['product_analytics_events']['Update'];

// ---------------------------------------------------------------------------
// Joined / enriched types (not stored directly, assembled by repositories)
// ---------------------------------------------------------------------------

export interface TrendEvidenceWithItem extends TrendEvidenceRow {
  item: ItemFull;
}

export interface TrendWithEvidence extends TrendRow {
  evidence: TrendEvidenceWithItem[];
}

export interface ItemWithCategories extends ItemRow {
  categories: CategoryRow[];
}

export interface ItemWithSummary extends ItemRow {
  summary: SummaryRow | null;
}

export interface ItemFull extends ItemRow {
  categories: CategoryRow[];
  summary: SummaryRow | null;
  source: SourceRow;
  is_bookmarked?: boolean;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Database stats (used by diagnostics and dashboard)
// ---------------------------------------------------------------------------

export interface DatabaseStats {
  sourceCount: number;
  activeSourceCount: number;
  itemCount: number;
  categoryCount: number;
  summaryCount: number;
  latestItemDiscoveredAt: string | null;
  latestCollectionRun: CollectionRunRow | null;
}
