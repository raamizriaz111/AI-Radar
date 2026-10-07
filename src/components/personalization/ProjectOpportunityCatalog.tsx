'use client';

import { useState } from 'react';
import {
  ProjectOpportunity,
  ProjectOpportunityDifficulty,
  ProjectOpportunityStatus,
  UserProfile,
} from '@/lib/personalization/types';
import { ProjectOpportunityCard } from './ProjectOpportunityCard';
import { Search, Filter, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectOpportunityCatalogProps {
  initialOpportunities: ProjectOpportunity[];
  profile: UserProfile;
}

export function ProjectOpportunityCatalog({
  initialOpportunities,
  profile,
}: ProjectOpportunityCatalogProps) {
  const [opportunities, setOpportunities] = useState<ProjectOpportunity[]>(initialOpportunities);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleStatusChange = (slug: string, newStatus: ProjectOpportunityStatus, notes?: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.slug === slug ? { ...opp, userStatus: newStatus, userNotes: notes ?? opp.userNotes } : opp))
    );
  };

  const difficulties: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Difficulties' },
    { id: 'small', label: 'Small (Weekend)' },
    { id: 'medium', label: 'Medium (1–2 Weeks)' },
    { id: 'large', label: 'Large (System)' },
  ];

  const statuses: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'saved', label: 'Saved' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'built', label: 'Built' },
  ];

  // Filtering
  const filtered = opportunities.filter((opp) => {
    if (opp.userStatus === 'dismissed') return false;

    if (selectedDifficulty !== 'all' && opp.difficulty !== selectedDifficulty) {
      return false;
    }

    if (selectedStatus !== 'all' && opp.userStatus !== selectedStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        opp.title.toLowerCase().includes(q) ||
        opp.problemStatement.toLowerCase().includes(q) ||
        opp.proposedSolution.toLowerCase().includes(q) ||
        opp.technicalStack.some((t) => t.toLowerCase().includes(q)) ||
        opp.requiredSkills.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by skill, technology, or problem..."
            className="w-full rounded border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Difficulty filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDifficulty(d.id)}
              className={cn(
                'rounded px-2.5 py-1 text-xs transition-colors',
                selectedDifficulty === d.id
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border-l border-border pl-3">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStatus(s.id)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                selectedStatus === s.id
                  ? 'bg-secondary text-foreground font-semibold border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <Briefcase size={24} className="mx-auto mb-2 text-muted-foreground/60" />
          <h4 className="text-sm font-semibold text-foreground mb-1">No matching project opportunities</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try resetting your difficulty or status filters, or edit your skill profile in Settings to discover more matches.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((opportunity) => (
            <ProjectOpportunityCard
              key={opportunity.slug}
              opportunity={opportunity}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
