import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:1000px_100%]',
        className
      )}
    />
  );
}
