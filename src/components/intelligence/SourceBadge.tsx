import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  name: string;
  /** If provided, renders as an external link */
  url?: string;
  className?: string;
}

export function SourceBadge({ name, url, className }: SourceBadgeProps) {
  const baseClass = cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className);

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClass, 'transition-colors hover:text-foreground')}
        aria-label={`Source: ${name} (opens in new tab)`}
      >
        {name}
        <ExternalLink size={10} aria-hidden="true" />
      </a>
    );
  }

  return <span className={baseClass}>{name}</span>;
}
