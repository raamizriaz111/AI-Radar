'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SearchModal } from './SearchModal';

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search AI Radar"
        className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-foreground"
      >
        <Search size={12} aria-hidden="true" />
        <span>Search</span>
        <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[9px] text-muted-foreground/60">
          ⌘K
        </kbd>
      </button>

      <SearchModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
