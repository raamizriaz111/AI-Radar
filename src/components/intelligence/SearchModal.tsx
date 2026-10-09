'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ExternalLink,
  TrendingUp,
  Briefcase,
  GraduationCap,
  FileText,
  Loader2,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    items: any[];
    trends: any[];
    projects: any[];
    learningTopics: any[];
    total: number;
  }>({
    items: [],
    trends: [],
    projects: [],
    learningTopics: [],
    total: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ items: [], trends: [], projects: [], learningTopics: [], total: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || { items: [], trends: [], projects: [], learningTopics: [], total: 0 });
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-md sm:pt-24">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search size={16} className="text-muted-foreground mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intelligence, trends, projects, topics..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {loading && <Loader2 size={16} className="animate-spin text-muted-foreground mr-2" />}
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Type to search across articles, trends, coding agents, and project opportunities.
            </div>
          )}

          {query.trim() && results.total === 0 && !loading && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching intelligence found for &quot;{query}&quot;.
            </div>
          )}

          {/* Items */}
          {results.items.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Articles & Developments ({results.items.length})
              </p>
              <div className="space-y-1.5">
                {results.items.map((it) => (
                  <a
                    key={it.id}
                    href={it.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs hover:border-primary/40 hover:bg-accent transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-foreground line-clamp-1">{it.title}</h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                        {it.summary?.summary || it.description}
                      </p>
                    </div>
                    <ExternalLink size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Trends */}
          {results.trends.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Emerging Trends ({results.trends.length})
              </p>
              <div className="space-y-1.5">
                {results.trends.map((t) => (
                  <Link
                    key={t.id}
                    href={`/trends?id=${t.id}`}
                    onClick={onClose}
                    className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs hover:border-primary/40 hover:bg-accent transition-colors"
                  >
                    <TrendingUp size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">{t.title}</h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Project Opportunities ({results.projects.length})
              </p>
              <div className="space-y-1.5">
                {results.projects.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/business#${p.slug}`}
                    onClick={onClose}
                    className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs hover:border-primary/40 hover:bg-accent transition-colors"
                  >
                    <Briefcase size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">{p.title}</h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                        {p.problemStatement}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Learning Topics */}
          {results.learningTopics.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Learning Topics ({results.learningTopics.length})
              </p>
              <div className="space-y-1.5">
                {results.learningTopics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/career#${topic.slug}`}
                    onClick={onClose}
                    className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs hover:border-primary/40 hover:bg-accent transition-colors"
                  >
                    <GraduationCap size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">{topic.title}</h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                        {topic.summary}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/60 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{results.total} results found</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
