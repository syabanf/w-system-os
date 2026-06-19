"use client";

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/presentation/shared/AnimatedNumber";
import { cn } from "@/lib/cn";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  accent?: string;
  emphasis?: boolean;
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  trend = "flat",
  icon: Icon,
  accent = "#FAFAF9",
  emphasis,
}: MetricCardProps) {
  const trendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    trend === "up"
      ? "text-emerald-300"
      : trend === "down"
        ? "text-rose-300"
        : "text-zinc-400";

  return (
    <div
      className={cn(
        "glass surface-smooth relative overflow-hidden rounded-[20px] p-4 md:p-5",
        // Pronounced lift on hover; faster active-state response for snappier feel.
        "motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] hover:shadow-[0_22px_70px_-18px_rgba(0,0,0,0.6)]",
        "active:translate-y-0 active:scale-100 active:duration-75",
        emphasis && "subtle-ring",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
        <span>{label}</span>
        {Icon ? (
          <span
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ background: `${accent}22`, color: accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl md:text-[26px] lg:text-[28px]">
          <AnimatedNumber value={value} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        {delta ? (
          <span className={cn("inline-flex items-center gap-1 font-medium", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" /> {delta}
          </span>
        ) : (
          <span />
        )}
        {hint ? <span className="text-zinc-500">{hint}</span> : null}
      </div>
    </div>
  );
}
