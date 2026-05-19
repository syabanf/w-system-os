"use client";

import { formatIDRCompact, formatPercent } from "@/lib/currency";
import type { FinanceOverviewDTO } from "@/application/dtos/FinanceDTO";

export function ProfitabilityPanel({ rows }: { rows: FinanceOverviewDTO["profitabilityByProject"] }) {
  const sorted = rows.slice().sort((a, b) => b.grossMargin - a.grossMargin);

  return (
    <ul className="space-y-1.5">
      {sorted.map((r) => (
        <li
          key={r.projectId}
          className="grid grid-cols-12 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
        >
          <div className="col-span-5 min-w-0">
            <div className="truncate text-xs text-zinc-100">{r.projectName}</div>
          </div>
          <div className="col-span-5 relative h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.max(2, Math.min(100, r.grossMargin + 50))}%`,
                background:
                  r.grossMargin < 0
                    ? "#EF4444"
                    : r.grossMargin < 10
                      ? "linear-gradient(90deg,#F59E0B,#FAFAF9)"
                      : "linear-gradient(90deg,#22C55E,#3B82F6)",
              }}
            />
          </div>
          <div className="col-span-2 text-right">
            <div
              className={`font-mono text-[11px] ${
                r.grossMargin < 0 ? "text-rose-300" : r.grossMargin < 10 ? "text-amber-300" : "text-emerald-300"
              }`}
            >
              {formatPercent(r.grossMargin, 0)}
            </div>
            <div className="font-mono text-[9px] text-zinc-500">{formatIDRCompact(r.revenue)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
