export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-muted rounded" />
      <div className="h-64 bg-muted rounded" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-96 bg-muted rounded" />
        <div className="h-96 bg-muted rounded" />
      </div>
    </div>
  );
}
