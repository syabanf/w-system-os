"use client";

import type { UtilizationSummary } from "@/application/use-cases/resources/GetTeamUtilization";

export function TeamCapacityPanel({ summary }: { summary: UtilizationSummary }) {
  const sorted = summary.byDepartment.slice().sort((a, b) => b.average - a.average);

  return (
    <ul className="space-y-2">
      {sorted.map((d) => (
        <li key={d.department} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]">
          <span className="w-32 truncate text-[11px] text-zinc-200">{d.department}</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.min(100, d.average)}%`,
                background:
                  d.average > 100
                    ? "#EF4444"
                    : d.average > 90
                      ? "linear-gradient(90deg,#F59E0B,#FAFAF9)"
                      : "linear-gradient(90deg,#3B82F6,#22C55E)",
              }}
            />
          </div>
          <span className="w-14 text-right font-mono text-[10px] text-zinc-300">
            {d.average.toFixed(0)}%
          </span>
          <span className="w-10 text-right text-[10px] text-zinc-500">{d.headcount}p</span>
        </li>
      ))}
    </ul>
  );
}
