"use client";

import { cn } from "@/lib/cn";

export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "wit";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-white/8 text-zinc-200 ring-white/10",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  wit: "bg-white/10 text-zinc-50 ring-white/20",
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ tone = "neutral", children, className, dot }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-emerald-400",
            tone === "warning" && "bg-amber-400",
            tone === "danger" && "bg-rose-400 animate-pulse-soft",
            tone === "info" && "bg-sky-400",
            tone === "wit" && "bg-zinc-50 animate-pulse-soft",
            tone === "neutral" && "bg-zinc-300",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
