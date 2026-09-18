import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-control bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function QueueTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="h-10 bg-slate-100 rounded-control animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-card shadow-xs space-x-4"
        >
          <div className="flex items-center space-x-3 w-1/4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1 w-full">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-20 rounded-control" />
        </div>
      ))}
    </div>
  );
}
