"use client";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  /** Width via Tailwind (e.g. "w-32") or arbitrary ("w-[140px]"). */
  width?: string;
  /** Height via Tailwind (e.g. "h-4") or arbitrary. */
  height?: string;
  /** Rounded corner override. */
  rounded?: string;
}

/**
 * Single shimmer block. Compose into rows/cards to mimic the eventual layout.
 * Animation is a CSS-only gradient sweep — keeps the bundle lean.
 */
export function Skeleton({
  className,
  width = "w-full",
  height = "h-3.5",
  rounded = "rounded-md",
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-skeleton-sweep",
        "bg-[linear-gradient(110deg,rgba(255,255,255,0.04)_8%,rgba(255,255,255,0.10)_18%,rgba(255,255,255,0.04)_33%)]",
        "bg-[length:200%_100%]",
        width,
        height,
        rounded,
        className,
      )}
    />
  );
}

/* Convenience compositions — drop-in replacements for common loading states. */

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5">
      <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton width="w-2/5" height="h-3" />
        <Skeleton width="w-3/5" height="h-2.5" />
      </div>
      <Skeleton width="w-16" height="h-3" />
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonMetricGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }, (_, i) => (
        <div
          key={i}
          className="glass-soft rounded-2xl border border-white/8 p-4"
        >
          <Skeleton width="w-1/3" height="h-2.5" />
          <Skeleton className="mt-3" width="w-1/2" height="h-7" />
          <Skeleton className="mt-2" width="w-2/3" height="h-2.5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLoadingView() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton width="w-32" height="h-3" />
        <Skeleton width="w-2/3" height="h-7" />
        <Skeleton width="w-1/2" height="h-3" />
      </div>
      <SkeletonMetricGrid />
      <div className="glass rounded-[20px] p-5">
        <div className="mb-4 space-y-2">
          <Skeleton width="w-24" height="h-2.5" />
          <Skeleton width="w-48" height="h-4" />
        </div>
        <SkeletonList rows={6} />
      </div>
    </div>
  );
}
