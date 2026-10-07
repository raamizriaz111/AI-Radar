import { cn } from '@/lib/utils';
import { type StatusType } from '@/lib/types';

interface StatusConfig {
  dot: string;
  text: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  idle:    { dot: 'bg-muted-foreground/40',               text: 'text-muted-foreground' },
  running: { dot: 'bg-blue-400 animate-pulse',            text: 'text-blue-400' },
  success: { dot: 'bg-emerald-400',                       text: 'text-emerald-400' },
  error:   { dot: 'bg-red-400',                           text: 'text-red-400' },
  warning: { dot: 'bg-amber-400',                         text: 'text-amber-400' },
  offline: { dot: 'bg-muted-foreground/20',               text: 'text-muted-foreground/50' },
};

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="status"
      aria-label={`${label}: ${status}`}
    >
      <span
        className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', config.dot)}
        aria-hidden="true"
      />
      <span className={cn('text-xs', config.text)}>{label}</span>
    </div>
  );
}
