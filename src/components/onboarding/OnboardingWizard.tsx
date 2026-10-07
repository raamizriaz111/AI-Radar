'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Compass,
  Briefcase,
  Cpu,
  GraduationCap,
  Hammer,
  Layers,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
  'AI Agents',
  'LLM Engineering',
  'Coding Agents',
  'Machine Learning',
  'Computer Vision',
  'NLP',
  'Reasoning Models',
  'Automation',
  'Robotics',
  'Cybersecurity',
  'AI Research',
  'AI Startups',
  'AI Products',
  'Open Source AI',
];

const CAREER_ROLE_OPTIONS = [
  'Curious Explorer / General Interest',
  'Business Owner / Entrepreneur',
  'Product or Project Manager',
  'Designer / Creative',
  'Student / Lifelong Learner',
  'Software Developer',
  'AI Application Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Automation Specialist',
];

const TECH_OPTIONS = [
  'Python',
  'PyTorch',
  'TypeScript',
  'React',
  'FastAPI',
  'Docker',
  'LLM APIs',
  'Model Context Protocol (MCP)',
  'Vector databases',
  'Transformers',
  'LangChain / LangGraph',
  'Next.js',
  'CUDA',
  'Git',
];

const LEARNING_GOAL_OPTIONS = [
  'Understand what AI can and cannot do',
  'Discover tools to make my daily work faster',
  'Master AI Agents and Tool Calling',
  'Production LLM Evaluation & RAG',
  'Fine-tuning & LoRA Adaptations',
  'Inference Scaling & Reasoning Models',
  'Building Real-time Vision Applications',
  'AI Product Strategy & Architecture',
  'Automated Code Generation Workflows',
];

const PROJECT_TYPE_OPTIONS = [
  'AI Agents & Automation',
  'Developer Tools & Extensions',
  'AI Applications & SaaS',
  'Research Benchmark Tools',
  'Data Pipelines & Analysis',
  'Computer Vision Applications',
  'Domain-Specific Copilots',
];

const CATEGORY_OPTIONS = [
  { id: 'ai-news', label: 'Latest AI News & Headlines' },
  { id: 'ai-tools', label: 'New AI Tools to Try' },
  { id: 'research', label: 'New AI Systems & Research' },
  { id: 'coding-agents', label: 'AI That Writes Code' },
  { id: 'emerging-trends', label: "What's Growing & Trending" },
  { id: 'career', label: 'Jobs & Learning Opportunities' },
  { id: 'business', label: 'Business & Startup Ideas' },
  { id: 'safety-regulation', label: 'Safety, Ethics & Government Rules' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [interests, setInterests] = useState<string[]>(['AI Agents', 'LLM Engineering']);
  const [careerInterests, setCareerInterests] = useState<string[]>(['AI Engineer']);
  const [technologies, setTechnologies] = useState<string[]>(['Python', 'TypeScript', 'LLM APIs']);
  const [customTech, setCustomTech] = useState('');
  const [learningGoals, setLearningGoals] = useState<string[]>(['Master AI Agents and Tool Calling']);
  const [customGoal, setCustomGoal] = useState('');
  const [projectInterests, setProjectInterests] = useState<string[]>(['AI Agents & Automation']);
  const [customProject, setCustomProject] = useState('');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    'ai-news',
    'ai-tools',
    'coding-agents',
    'emerging-trends',
  ]);
  const [name, setName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'developing' | 'intermediate' | 'advanced'>('intermediate');

  const toggleSelection = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomItem = (val: string, list: string[], setter: (val: string[]) => void, clearInput: () => void) => {
    const trimmed = val.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
      clearInput();
    }
  };

  const handleSubmit = async (skipped = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skipped,
          name: name.trim() || undefined,
          experience_level: experienceLevel,
          interests,
          career_interests: careerInterests,
          technologies,
          learning_goals: learningGoals,
          project_interests: projectInterests,
          preferred_categories: preferredCategories,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save onboarding');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error completing onboarding');
      setLoading(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 7));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8">
      {/* Header & Progress */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Step {step} of 7
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            {step === 1 && 'What areas in AI interest you?'}
            {step === 2 && 'What are your career interests?'}
            {step === 3 && 'Which technologies are in your focus?'}
            {step === 4 && 'What do you want to learn?'}
            {step === 5 && 'What would you like to build?'}
            {step === 6 && 'Preferred intelligence topics'}
            {step === 7 && 'Your Profile Details'}
          </h2>
        </div>
        <button
          onClick={() => handleSubmit(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip All →
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Core Interests */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select the domains and topics you want AI Radar to track. Multiple selections supported.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((item) => {
              const selected = interests.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleSelection(interests, item, setInterests)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    selected
                      ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
                      : 'border-border bg-card hover:bg-accent text-muted-foreground'
                  )}
                >
                  {selected && <Check size={12} />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Career Interests */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select roles you currently hold or are targeting. This tailors skill gap detection and career signals.
          </p>
          <div className="flex flex-wrap gap-2">
            {CAREER_ROLE_OPTIONS.map((role) => {
              const selected = careerInterests.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleSelection(careerInterests, role, setCareerInterests)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                    selected
                      ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
                      : 'border-border bg-card hover:bg-accent text-muted-foreground'
                  )}
                >
                  {selected && <Check size={12} />}
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Technologies */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select your technical stack and tools you use or want to learn.
          </p>
          <div className="flex flex-wrap gap-2">
            {TECH_OPTIONS.map((tech) => {
              const selected = technologies.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleSelection(technologies, tech, setTechnologies)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    selected
                      ? 'border-primary/50 bg-primary/15 text-primary shadow-sm'
                      : 'border-border bg-card hover:bg-accent text-muted-foreground'
                  )}
                >
                  {selected && <Check size={12} />}
                  {tech}
                </button>
              );
            })}
          </div>
          {/* Custom tech input */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customTech}
              onChange={(e) => setCustomTech(e.target.value)}
              placeholder="Add other technology..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem(customTech, technologies, setTechnologies, () => setCustomTech(''));
                }
              }}
            />
            <button
              type="button"
              onClick={() => addCustomItem(customTech, technologies, setTechnologies, () => setCustomTech(''))}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Learning Goals */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            What competencies are you prioritizing? Relevant developments and learning maps will connect to these.
          </p>
          <div className="space-y-2">
            {LEARNING_GOAL_OPTIONS.map((goal) => {
              const selected = learningGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleSelection(learningGoals, goal, setLearningGoals)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all',
                    selected
                      ? 'border-primary/40 bg-primary/10 text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span>{goal}</span>
                  {selected ? <Check size={14} className="text-primary flex-shrink-0" /> : null}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Add custom learning goal..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem(customGoal, learningGoals, setLearningGoals, () => setCustomGoal(''));
                }
              }}
            />
            <button
              type="button"
              onClick={() => addCustomItem(customGoal, learningGoals, setLearningGoals, () => setCustomGoal(''))}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Project Types */}
      {step === 5 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            What types of artifacts or tools do you want to build next?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PROJECT_TYPE_OPTIONS.map((proj) => {
              const selected = projectInterests.includes(proj);
              return (
                <button
                  key={proj}
                  type="button"
                  onClick={() => toggleSelection(projectInterests, proj, setProjectInterests)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3 text-left text-xs transition-all',
                    selected
                      ? 'border-primary/40 bg-primary/10 text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span>{proj}</span>
                  {selected && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customProject}
              onChange={(e) => setCustomProject(e.target.value)}
              placeholder="Add custom project interest..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem(customProject, projectInterests, setProjectInterests, () => setCustomProject(''));
                }
              }}
            />
            <button
              type="button"
              onClick={() => addCustomItem(customProject, projectInterests, setProjectInterests, () => setCustomProject(''))}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Preferred Categories */}
      {step === 6 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select the intelligence categories you want emphasized in your feeds and briefings.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const selected = preferredCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleSelection(preferredCategories, cat.id, setPreferredCategories)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3 text-left text-xs transition-all',
                    selected
                      ? 'border-primary/40 bg-primary/10 text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span>{cat.label}</span>
                  {selected && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 7: Minimal Profile */}
      {step === 7 && (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Optional personal details. No sensitive demographic data is collected.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Your Name or Display Handle <span className="text-muted-foreground">(Optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Overall AI Engineering Experience
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['beginner', 'developing', 'intermediate', 'advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperienceLevel(lvl)}
                  className={cn(
                    'rounded-lg border p-2 text-center text-xs capitalize transition-all',
                    experienceLevel === lvl
                      ? 'border-primary/50 bg-primary/15 text-primary font-medium'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent'
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft size={12} /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {step < 7 ? (
            <>
              <button
                type="button"
                onClick={nextStep}
                className="text-xs text-muted-foreground hover:text-foreground mr-2"
              >
                Skip step
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue <ArrowRight size={12} />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Finish Onboarding'} <Check size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
