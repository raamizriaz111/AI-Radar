'use client';

import { useState, useEffect } from 'react';
import {
  UserProfile,
  UserSkill,
  ExperienceLevel,
  SkillProficiency,
  DEFAULT_USER_PROFILE,
  ROLE_OPTIONS,
  SKILL_TAXONOMY,
} from '@/lib/personalization/types';
import {
  Check,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  GraduationCap,
  Target,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New item input states
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillProficiency>('intermediate');
  const [newSkillCat, setNewSkillCat] = useState('Languages');
  const [newTech, setNewTech] = useState('');
  const [newCareerGoal, setNewCareerGoal] = useState('');
  const [newLearningGoal, setNewLearningGoal] = useState('');
  const [newProjectInterest, setNewProjectInterest] = useState('');
  const [newExcludedTopic, setNewExcludedTopic] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.ok && data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          experience_level: profile.experienceLevel,
          primary_role_interest: profile.primaryRoleInterest,
          secondary_role_interests: profile.secondaryRoleInterests,
          skills: profile.skills,
          technologies: profile.technologies,
          career_goals: profile.careerGoals,
          learning_goals: profile.learningGoals,
          project_interests: profile.projectInterests,
          preferred_topics: profile.preferredTopics,
          excluded_topics: profile.excludedTopics,
          metadata: profile.metadata,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset profile to default engineering template?')) {
      setProfile({ ...DEFAULT_USER_PROFILE });
    }
  };

  // Skill management
  const addSkill = () => {
    if (!newSkillName.trim()) return;
    const existingIdx = profile.skills.findIndex(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (existingIdx >= 0) {
      const updated = [...profile.skills];
      updated[existingIdx].level = newSkillLevel;
      setProfile({ ...profile, skills: updated });
    } else {
      setProfile({
        ...profile,
        skills: [
          ...profile.skills,
          {
            name: newSkillName.trim(),
            level: newSkillLevel,
            category: newSkillCat,
          },
        ],
      });
    }
    setNewSkillName('');
  };

  const removeSkill = (name: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s.name !== name),
    });
  };

  const updateSkillLevel = (name: string, level: SkillProficiency) => {
    setProfile({
      ...profile,
      skills: profile.skills.map((s) => (s.name === name ? { ...s, level } : s)),
    });
  };

  // Tech management
  const addTech = () => {
    if (!newTech.trim()) return;
    if (!profile.technologies.includes(newTech.trim())) {
      setProfile({
        ...profile,
        technologies: [...profile.technologies, newTech.trim()],
      });
    }
    setNewTech('');
  };

  const removeTech = (tech: string) => {
    setProfile({
      ...profile,
      technologies: profile.technologies.filter((t) => t !== tech),
    });
  };

  // Goals
  const addCareerGoal = () => {
    if (!newCareerGoal.trim()) return;
    setProfile({ ...profile, careerGoals: [...profile.careerGoals, newCareerGoal.trim()] });
    setNewCareerGoal('');
  };

  const removeCareerGoal = (idx: number) => {
    setProfile({
      ...profile,
      careerGoals: profile.careerGoals.filter((_, i) => i !== idx),
    });
  };

  const addLearningGoal = () => {
    if (!newLearningGoal.trim()) return;
    setProfile({ ...profile, learningGoals: [...profile.learningGoals, newLearningGoal.trim()] });
    setNewLearningGoal('');
  };

  const removeLearningGoal = (idx: number) => {
    setProfile({
      ...profile,
      learningGoals: profile.learningGoals.filter((_, i) => i !== idx),
    });
  };

  const addProjectInterest = () => {
    if (!newProjectInterest.trim()) return;
    setProfile({ ...profile, projectInterests: [...profile.projectInterests, newProjectInterest.trim()] });
    setNewProjectInterest('');
  };

  const removeProjectInterest = (idx: number) => {
    setProfile({
      ...profile,
      projectInterests: profile.projectInterests.filter((_, i) => i !== idx),
    });
  };

  const addExcludedTopic = () => {
    if (!newExcludedTopic.trim()) return;
    if (!profile.excludedTopics.includes(newExcludedTopic.trim().toLowerCase())) {
      setProfile({
        ...profile,
        excludedTopics: [...profile.excludedTopics, newExcludedTopic.trim().toLowerCase()],
      });
    }
    setNewExcludedTopic('');
  };

  const removeExcludedTopic = (topic: string) => {
    setProfile({
      ...profile,
      excludedTopics: profile.excludedTopics.filter((t) => t !== topic),
    });
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground py-4">Loading personal profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Personal AI Profile & Relevance Engine
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your skills, target roles, and learning priorities. AI Radar uses this strictly
            to filter relevance, detect skill gaps, and suggest project ideas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {saving ? (
              'Saving...'
            ) : saveSuccess ? (
              <>
                <Check size={13} className="text-emerald-400" /> Saved!
              </>
            ) : (
              <>
                <Save size={13} /> Save Profile
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Basic Experience & Role */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Briefcase size={14} className="text-primary" /> Role & Experience Level
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Profile / Display Name
            </label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. AI Engineer"
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Experience Level
            </label>
            <select
              value={profile.experienceLevel}
              onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value as ExperienceLevel })}
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="beginner">Beginner (Exploring AI concepts)</option>
              <option value="developing">Developing (Building initial prototypes)</option>
              <option value="intermediate">Intermediate (Shipping production applications)</option>
              <option value="advanced">Advanced (Frontier systems & research)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Primary Target Role Focus
          </label>
          <div className="flex gap-2">
            <select
              value={ROLE_OPTIONS.includes(profile.primaryRoleInterest) ? profile.primaryRoleInterest : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setProfile({ ...profile, primaryRoleInterest: e.target.value });
                }
              }}
              className="rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
              <option value="custom">Custom Role...</option>
            </select>

            <input
              type="text"
              value={profile.primaryRoleInterest}
              onChange={(e) => setProfile({ ...profile, primaryRoleInterest: e.target.value })}
              placeholder="Type custom role..."
              className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Skills Profile with Proficiency Levels */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers size={14} className="text-primary" /> Stated Skills & Proficiency ({profile.skills.length})
          </h4>
        </div>

        {/* Current skills list */}
        <div className="space-y-2">
          {profile.skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between gap-2 rounded border border-border/70 bg-muted/20 px-3 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{skill.name}</span>
                {skill.category && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                    {skill.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={skill.level}
                  onChange={(e) => updateSkillLevel(skill.name, e.target.value as SkillProficiency)}
                  className="rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none"
                >
                  <option value="interested">Interested</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <button
                  onClick={() => removeSkill(skill.name)}
                  className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  aria-label={`Remove skill ${skill.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new skill */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Add new skill (e.g. Model Evaluation)..."
            className="flex-1 min-w-[180px] rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          />

          <select
            value={newSkillCat}
            onChange={(e) => setNewSkillCat(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
          >
            {Object.keys(SKILL_TAXONOMY).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as SkillProficiency)}
            className="rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="interested">Interested</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button
            onClick={addSkill}
            className="flex items-center gap-1 rounded border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <Plus size={12} /> Add Skill
          </button>
        </div>
      </div>

      {/* Technologies in Stack */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Layers size={14} className="text-primary" /> Active Technology Stack ({profile.technologies.length})
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {profile.technologies.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-2.5 py-1 text-xs text-foreground font-mono"
            >
              {tech}
              <button
                onClick={() => removeTech(tech)}
                className="text-muted-foreground hover:text-red-400"
                aria-label={`Remove tech ${tech}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            placeholder="Add technology (e.g. Ollama, FastAPI)..."
            className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && addTech()}
          />
          <button
            onClick={addTech}
            className="flex items-center gap-1 rounded border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Career & Learning Goals */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Career Goals */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Target size={14} className="text-primary" /> Career Goals ({profile.careerGoals.length})
          </h4>

          <div className="space-y-1.5">
            {profile.careerGoals.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs"
              >
                <span className="text-foreground/90">{goal}</span>
                <button
                  onClick={() => removeCareerGoal(idx)}
                  className="text-muted-foreground hover:text-red-400 p-0.5"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCareerGoal}
              onChange={(e) => setNewCareerGoal(e.target.value)}
              placeholder="Add career goal..."
              className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && addCareerGoal()}
            />
            <button
              onClick={addCareerGoal}
              className="flex items-center gap-1 rounded border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground hover:bg-accent"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>

        {/* Learning Goals */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <GraduationCap size={14} className="text-primary" /> Active Learning Goals ({profile.learningGoals.length})
          </h4>

          <div className="space-y-1.5">
            {profile.learningGoals.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs"
              >
                <span className="text-foreground/90">{goal}</span>
                <button
                  onClick={() => removeLearningGoal(idx)}
                  className="text-muted-foreground hover:text-red-400 p-0.5"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newLearningGoal}
              onChange={(e) => setNewLearningGoal(e.target.value)}
              placeholder="Add learning focus..."
              className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && addLearningGoal()}
            />
            <button
              onClick={addLearningGoal}
              className="flex items-center gap-1 rounded border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground hover:bg-accent"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Excluded Topics (Negative Filters) */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield size={14} className="text-amber-400" /> Excluded Topics (Negative Filters)
        </h4>
        <p className="text-xs text-muted-foreground">
          Items or trends mentioning these terms will receive a relevance score of 0 and be filtered out of your personalized feeds.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {profile.excludedTopics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
            >
              {topic}
              <button
                onClick={() => removeExcludedTopic(topic)}
                className="text-red-400 hover:text-red-200"
                aria-label={`Remove filter ${topic}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newExcludedTopic}
            onChange={(e) => setNewExcludedTopic(e.target.value)}
            placeholder="Add excluded topic (e.g. crypto, rumors)..."
            className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && addExcludedTopic()}
          />
          <button
            onClick={addExcludedTopic}
            className="flex items-center gap-1 rounded border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <Plus size={12} /> Add Negative Filter
          </button>
        </div>
      </div>
    </div>
  );
}
