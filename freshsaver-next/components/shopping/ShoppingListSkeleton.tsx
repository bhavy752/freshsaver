import { Skeleton } from '@/components/ui/skeleton';

export function ShoppingListSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-48 rounded-3xl bg-slate-800/50 border border-slate-700" />
      <Skeleton className="h-28 rounded-2xl bg-slate-800/50 border border-slate-700" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50">
          <div className="border-b border-slate-700 px-4 py-3">
            <Skeleton className="h-4 w-28 bg-slate-700" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((__, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-lg bg-slate-700" />
                <Skeleton className="h-8 w-8 rounded-lg bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-1/2 bg-slate-700" />
                  <Skeleton className="h-2.5 w-1/4 bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}