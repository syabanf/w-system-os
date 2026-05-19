"use client";

import { cn } from "@/lib/cn";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  height = 240,
}: ChartCardProps) {
  return (
    <div className={cn("glass rounded-[20px] p-5", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-50">{title}</div>
          {description ? (
            <div className="mt-0.5 text-xs text-zinc-400">{description}</div>
          ) : null}
        </div>
        {action}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
