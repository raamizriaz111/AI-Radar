import { cn } from '@/lib/utils';
import { type Category } from '@/lib/types';

interface CategoryConfig {
  label: string;
  className: string;
}

const categoryConfig: Record<Category, CategoryConfig> = {
  'ai-news':          { label: 'AI News',           className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'ai-tools':         { label: 'New Tool',           className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'models':           { label: 'New AI System',      className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  'research':         { label: 'Research',           className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  'coding-agents':    { label: 'Codes for You',      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'emerging-trends':  { label: 'Growing Topic',      className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'career':           { label: 'Career',             className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'business':         { label: 'Business',           className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'safety-regulation':{ label: 'Safety & Rules',     className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? {
    label: category,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
