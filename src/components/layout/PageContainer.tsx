import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Narrow mode constrains the content width to ~768px — good for settings/forms */
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow = false }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div
        className={cn(
          'mx-auto px-4 py-6 sm:px-6',
          narrow ? 'max-w-3xl' : 'max-w-5xl',
          className
        )}
      >
        {children}
      </div>
    </main>
  );
}
