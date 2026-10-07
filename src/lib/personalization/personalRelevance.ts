// =============================================================================
// AI Radar — Explainable Personal Relevance Engine
// =============================================================================
// Computes transparent, explainable relevance scores matching collected items,
// trends, or opportunities against a user's stated profile.
//
// Rules:
// 1. Transparent formula: no black-box scores.
// 2. Explainable reasons: every score must be accompanied by explicit reasons.
// 3. Negative filters: respected immediately (excluded topics = 0 relevance).
// =============================================================================

import { ItemFull } from '@/lib/database.types';
import { UserProfile, PersonalRelevanceMatch } from './types';

export interface AssessableEntity {
  title: string;
  description?: string | null;
  content_text?: string | null;
  technologies?: string[] | null;
  topics?: string[] | null;
  category_slugs?: string[] | null;
  metadata?: Record<string, unknown> | null;
  summary?: {
    summary?: string;
    keyPoints?: string[];
    technologies?: string[];
    topics?: string[];
  } | null;
}

/**
 * Normalizes text to lowercase alphanumeric tokens for robust matching
 */
function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+.\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Checks if a search phrase appears inside searchable text
 */
function textIncludesPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase().trim();
  
  // Exact phrase match
  if (lowerText.includes(lowerPhrase)) return true;

  // Word boundary match for short keywords
  const regex = new RegExp(`\\b${lowerPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(lowerText);
}

/**
 * Computes deterministic, explainable personal relevance between an item/trend/project
 * and the user's active profile.
 */
export function computePersonalRelevance(
  entity: AssessableEntity | ItemFull,
  profile: UserProfile
): PersonalRelevanceMatch {
  // 1. Gather all searchable text from the entity
  const entityAny = entity as any;
  const metadataObj = (entity.metadata || {}) as Record<string, unknown>;
  const summaryAny = entity.summary as any;
  const summaryTechs = Array.isArray(summaryAny?.technologies) ? (summaryAny.technologies as string[]) : [];
  const summaryTopics = Array.isArray(summaryAny?.topics) ? (summaryAny.topics as string[]) : [];

  const extractedTechs: string[] = [
    ...(Array.isArray(entityAny.technologies) ? entityAny.technologies : []),
    ...(Array.isArray(metadataObj.technologies) ? (metadataObj.technologies as string[]) : []),
    ...summaryTechs,
  ];

  const extractedTopics: string[] = [
    ...(Array.isArray(entityAny.topics) ? entityAny.topics : []),
    ...(Array.isArray(metadataObj.topics) ? (metadataObj.topics as string[]) : []),
    ...summaryTopics,
  ];

  const categorySlugs: string[] = [
    ...(Array.isArray(entityAny.category_slugs) ? entityAny.category_slugs : []),
    ...('categories' in entity && Array.isArray((entity as ItemFull).categories)
      ? (entity as ItemFull).categories.map((c) => c.slug)
      : []),
  ];

  const summaryText = entity.summary?.summary || '';
  const keyPointsText = Array.isArray(summaryAny?.key_points)
    ? summaryAny.key_points.join(' ')
    : Array.isArray(summaryAny?.keyPoints)
    ? summaryAny.keyPoints.join(' ')
    : '';
  const descriptionText = entity.description || '';
  const titleText = entity.title || '';

  const combinedSearchableText = [
    titleText,
    descriptionText,
    summaryText,
    keyPointsText,
    ...extractedTechs,
    ...extractedTopics,
    ...categorySlugs,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 2. Check Excluded Topics First
  for (const excluded of profile.excludedTopics) {
    if (excluded.trim() && textIncludesPhrase(combinedSearchableText, excluded)) {
      return {
        score: 0,
        matchedSkills: [],
        matchedTechnologies: [],
        matchedGoals: [],
        matchedRoles: [],
        reasons: [`Excluded by topic filter: "${excluded}"`],
        isExcluded: true,
      };
    }
  }

  const matchedSkills: string[] = [];
  const matchedTechnologies: string[] = [];
  const matchedGoals: string[] = [];
  const matchedRoles: string[] = [];
  const reasons: string[] = [];

  let rawScore = 0;

  // 3. Match User Skills (Up to 35 points)
  for (const skill of profile.skills) {
    if (textIncludesPhrase(combinedSearchableText, skill.name)) {
      matchedSkills.push(skill.name);
      // Give higher weight to skills where level is intermediate or advanced
      const skillWeight = skill.level === 'advanced' ? 12 : skill.level === 'intermediate' ? 9 : 6;
      rawScore += skillWeight;
      reasons.push(`Mentions your skill: ${skill.name} (${skill.level})`);
    }
  }
  // Cap skill contribution at 35
  const skillScore = Math.min(rawScore, 35);
  rawScore = skillScore;

  // 4. Match User Technologies (Up to 25 points)
  let techScore = 0;
  for (const tech of profile.technologies) {
    if (textIncludesPhrase(combinedSearchableText, tech) && !matchedSkills.includes(tech)) {
      matchedTechnologies.push(tech);
      techScore += 8;
      reasons.push(`Features tech in your stack: ${tech}`);
    }
  }
  rawScore += Math.min(techScore, 25);

  // 5. Match Roles (Primary & Secondary) (Up to 20 points)
  const allRoles = [profile.primaryRoleInterest, ...profile.secondaryRoleInterests];
  for (const role of allRoles) {
    if (!role) continue;
    // Break role into key identifier tokens (e.g., 'Agent', 'Full Stack', 'ML')
    const roleTokens = role.toLowerCase().split(/[\s/]+/).filter((t) => t.length > 2);
    const matchesRoleToken = roleTokens.some((token) => textIncludesPhrase(combinedSearchableText, token));
    
    if (matchesRoleToken) {
      if (!matchedRoles.includes(role)) {
        matchedRoles.push(role);
        const isPrimary = role === profile.primaryRoleInterest;
        rawScore += isPrimary ? 12 : 7;
        reasons.push(`Relevant to role focus: ${role}${isPrimary ? ' (Primary)' : ''}`);
      }
    }
  }

  // 6. Match Learning Goals (Up to 20 points)
  let goalScore = 0;
  for (const goal of profile.learningGoals) {
    const goalTokens = normalizeTokens(goal).filter((t) => t.length > 3);
    const matchesGoal = goalTokens.some((token) => textIncludesPhrase(combinedSearchableText, token));
    if (matchesGoal) {
      matchedGoals.push(goal);
      goalScore += 10;
      reasons.push(`Aligns with learning goal: "${goal}"`);
    }
  }
  rawScore += Math.min(goalScore, 20);

  // 7. Match Preferred Topics (Bonus up to 10 points)
  for (const topic of profile.preferredTopics) {
    if (categorySlugs.includes(topic.toLowerCase()) || extractedTopics.map((t) => t.toLowerCase()).includes(topic.toLowerCase())) {
      rawScore += 5;
      reasons.push(`In your preferred topic: ${topic}`);
      break;
    }
  }

  // 8. Base relevance for important items if no specific keywords hit
  if (rawScore === 0 && reasons.length === 0) {
    reasons.push('General ecosystem update; not directly aligned with specific profile filters');
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    score: finalScore,
    matchedSkills,
    matchedTechnologies,
    matchedGoals,
    matchedRoles,
    reasons,
    isExcluded: false,
  };
}
