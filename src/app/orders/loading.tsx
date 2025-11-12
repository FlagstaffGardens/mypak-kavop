export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-20 bg-muted rounded w-1/2" />
        <div className="h-12 bg-muted rounded w-32" />
      </div>
      <div className="h-12 bg-muted rounded" />
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
      </div>
    </div>
  );
}
