'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/intelligence/EmptyState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors client-side safely
    console.error('Unhandled app error:', error.message);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-destructive/20 bg-card p-6 text-center">
        <EmptyState
          icon={AlertCircle}
          title="Unexpected Error"
          description={error.message || 'An error occurred while loading this view.'}
          compact
          action={
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
            >
              <RotateCcw size={12} />
              Try again
            </button>
          }
        />
      </div>
    </div>
  );
}
