export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading intelligence layer...</p>
      </div>
    </div>
  );
}
