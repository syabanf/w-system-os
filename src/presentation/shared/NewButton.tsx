"use client";

import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Canonical "create" action button. One consistent style + verb ("New …") and
 * placement (top-right of a module/section header) so every module's create
 * affordance looks and reads the same. Reserve other colors (emerald/rose) for
 * secondary/destructive actions — this is THE primary create control.
 */
export function NewButton({
  label,
  onClick,
  icon: Icon = Plus,
  className,
  size = "md",
}: {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "press inline-flex items-center gap-1.5 rounded-full bg-white/10 font-semibold text-zinc-100 transition-colors hover:bg-white/16",
        size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-[11px]",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
