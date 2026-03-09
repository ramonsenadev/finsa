import { Card } from "@/components/ui/card";

export function SkeletonIndicatorCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-3 py-4">
          <div className="px-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <Card className="p-6">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-64 animate-pulse rounded bg-muted" />
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-4 py-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border px-4 py-3 last:border-b-0">
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
