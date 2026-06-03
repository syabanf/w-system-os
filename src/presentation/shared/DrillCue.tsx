"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Persistent "this drills in / opens detail" affordance for clickable cards and
 * rows. Place inside a `group` container; the chevron nudges right on hover.
 * Make the parent `role="button"` with an `aria-label` so the affordance is
 * also exposed to assistive tech.
 */
export function DrillCue({
  label = "Open",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-zinc-200",
        className,
      )}
      aria-hidden
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </span>
  );
}
