import { Skeleton } from '@/components/ui/skeleton';

export function RadarSkeleton() {
  return (
    <div className="flex items-center justify-center p-8">
      <Skeleton className="w-[400px] h-[400px] rounded-full" />
    </div>
  );
}

export function DimensionCardSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-12 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RadarSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DimensionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
