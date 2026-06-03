"use client";

import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface BulkAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  tone?: "default" | "danger";
  /** Disable the action (e.g. while confirming). */
  disabled?: boolean;
}

interface BulkActionBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
  /** Singular noun for the selection label, e.g. "lead" → "3 leads selected". */
  noun?: string;
  className?: string;
}

/**
 * Inline bar surfaced above a table when one or more rows are selected. Shows
 * the selection count plus a set of bulk actions and a clear button. Render it
 * conditionally from the consuming view (it self-hides when count is 0).
 */
export function BulkActionBar({ count, actions, onClear, noun = "item", className }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2",
        className,
      )}
    >
      <span className="text-xs font-semibold text-zinc-100">
        {count} {noun}
        {count === 1 ? "" : "s"} selected
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={a.disabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                a.tone === "danger"
                  ? "text-rose-300 hover:bg-rose-500/15"
                  : "text-zinc-100 hover:bg-white/10",
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {a.label}
            </button>
          );
        })}
        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
