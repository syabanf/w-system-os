"use client";

import { ChevronRight, FolderTree } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Crumb {
  id: string;
  label: string;
  sublabel?: string;
}

interface DrillBreadcrumbProps {
  crumbs: Crumb[];
  onJump: (level: number) => void;
  ariaLabel?: string;
}

/**
 * Reusable top-down breadcrumb for module drill-downs.
 * Used by Projects, Clients, Leads, People, Support, Transactions.
 */
export function DrillBreadcrumb({
  crumbs,
  onJump,
  ariaLabel = "Drill-down",
}: DrillBreadcrumbProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="glass-soft flex flex-wrap items-center gap-1.5 rounded-full border border-white/8 px-3 py-1.5 text-[11px]"
    >
      <FolderTree className="h-3.5 w-3.5 text-zinc-500" />
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={c.id} className="flex items-center gap-1.5">
            <button
              onClick={() => onJump(i)}
              disabled={isLast}
              className={cn(
                "rounded-full px-2 py-0.5 transition-colors",
                isLast
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-400 hover:bg-white/8 hover:text-zinc-200",
              )}
            >
              <span className="truncate">{c.label}</span>
              {c.sublabel ? (
                <span className="ml-1 hidden font-mono text-[9px] text-zinc-500 sm:inline">
                  {c.sublabel}
                </span>
              ) : null}
            </button>
            {!isLast ? <ChevronRight className="h-3 w-3 text-zinc-600" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
