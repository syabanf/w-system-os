"use client";

import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div>
        {eyebrow ? (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-base font-semibold text-zinc-50">{title}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-zinc-400">{description}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
