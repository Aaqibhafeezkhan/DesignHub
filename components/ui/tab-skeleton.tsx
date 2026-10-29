/** Placeholder while a lazily loaded studio tab downloads. */
export function TabSkeleton() {
  return (
    <div role="status" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" aria-busy="true" aria-label="Loading">
      <div className="h-96 animate-pulse rounded-lg border bg-muted/40" />
      <div className="h-96 animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}
