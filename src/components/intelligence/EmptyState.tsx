import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  /** Compact variant uses less vertical padding — for use inside cards */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-14 px-6',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon size={20} />
        </div>
      )}
      <h3 className="mb-1.5 text-sm font-medium text-foreground">{title}</h3>
      <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
