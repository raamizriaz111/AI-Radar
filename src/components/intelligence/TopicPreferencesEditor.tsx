'use client';

// =============================================================================
// AI Radar — Topic Preferences Editor (Phase 5)
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Sliders, Check, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';
import type { UserPreferences } from '@/lib/types';
import { DEFAULT_PREFERENCES } from '@/lib/intelligence/types';

const ALL_CANDIDATE_TOPICS = [
  'LLMs',
  'AI Agents',
  'Models & Research',
  'Inference & Serving',
  'Safety & Regulation',
  'Developer Tools',
  'Code Generation',
  'Reasoning Models',
  'Multimodal',
  'Synthetic Data',
  'Quantization',
  'Retrieval Augmented Generation',
  'Robotics',
];

export function TopicPreferencesEditor() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.preferences) {
          setPreferences(data.preferences);
        }
      })
      .catch((err) => console.error('Failed to load preferences', err));
  }, []);

  const handleToggleTopic = (topic: string) => {
    setPreferences((prev) => {
      const exists = prev.topics.includes(topic);
      const updatedTopics = exists
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic];

      const updatedLevels = { ...prev.interestLevel };
      if (exists) {
        delete updatedLevels[topic];
      } else {
        updatedLevels[topic] = 'high';
      }

      return {
        ...prev,
        topics: updatedTopics,
        interestLevel: updatedLevels,
      };
    });
    setSavedSuccess(false);
  };

  const handleInterestLevelChange = (topic: string, level: 'high' | 'medium' | 'low') => {
    setPreferences((prev) => ({
      ...prev,
      interestLevel: {
        ...prev.interestLevel,
        [topic]: level,
      },
    }));
    setSavedSuccess(false);
  };

  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTopicInput.trim();
    if (!clean || preferences.topics.includes(clean)) return;

    setPreferences((prev) => ({
      ...prev,
      topics: [...prev.topics, clean],
      interestLevel: {
        ...prev.interestLevel,
        [clean]: 'high',
      },
    }));
    setNewTopicInput('');
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save preferences', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Topic & Relevance Profile
          </h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 size={13} /> Saved
            </>
          ) : isSaving ? (
            'Saving...'
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        AI Radar prioritizes Daily Briefings and highlights Emerging Trends based on your explicit topic interests. No opaque profiling or political inference.
      </p>

      {/* Topics Selection Grid */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-foreground">
          Followed Topics ({preferences.topics.length})
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CANDIDATE_TOPICS.map((topic) => {
            const isFollowed = preferences.topics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => handleToggleTopic(topic)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isFollowed
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-muted/40 text-muted-foreground border border-border hover:text-foreground'
                }`}
              >
                {isFollowed && <Check size={11} />}
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Topic */}
      <form onSubmit={handleAddCustomTopic} className="mb-5 flex gap-2">
        <input
          type="text"
          placeholder="Add custom keyword (e.g., Speculative Decoding)..."
          value={newTopicInput}
          onChange={(e) => setNewTopicInput(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newTopicInput.trim()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </form>

      {/* Followed Topics with Interest Level Tuning */}
      {preferences.topics.length > 0 && (
        <div className="border-t border-border/40 pt-4">
          <label className="mb-2 block text-xs font-medium text-foreground">
            Topic Priority Weights
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {preferences.topics.map((topic) => {
              const currentLevel = preferences.interestLevel?.[topic] || 'medium';
              return (
                <div
                  key={topic}
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-foreground/90">{topic}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={currentLevel}
                      onChange={(e) =>
                        handleInterestLevelChange(topic, e.target.value as any)
                      }
                      className="rounded border border-border bg-background px-2 py-0.5 text-[11px] text-foreground focus:outline-none"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleToggleTopic(topic)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Remove topic"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
