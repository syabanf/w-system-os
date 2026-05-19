"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/8 p-10 text-center">
      {Icon ? (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-zinc-300">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="text-sm font-medium text-zinc-100">{title}</div>
      {description ? (
        <div className="mt-1 max-w-sm text-xs text-zinc-400">{description}</div>
      ) : null}
    </div>
  );
}
