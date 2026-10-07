import Link from 'next/link';
import { Radar, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Radar size={24} />
      </div>
      <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Page Not Found
      </h2>
      <p className="mb-6 max-w-sm text-xs leading-relaxed text-muted-foreground">
        We couldn&apos;t find the page you were looking for. It might have been moved or doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Home
      </Link>
    </div>
  );
}
