"use client";

import { Briefcase } from "lucide-react";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import type { Project } from "@/domain/entities/Project";
import { formatPercent } from "@/lib/currency";

function tone(risk: Project["riskLevel"]) {
  if (risk === "critical") return "danger" as const;
  if (risk === "high") return "danger" as const;
  if (risk === "medium") return "warning" as const;
  return "success" as const;
}

export function ProjectHealthPanel({ projects }: { projects: Project[] }) {
  return (
    <ul className="space-y-2">
      {projects.length === 0 ? (
        <li className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-400">
          No at-risk projects — all clear.
        </li>
      ) : (
        projects.map((p) => (
          <li
            key={p.id}
            className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 p-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/8 text-zinc-300">
              <Briefcase className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-xs font-semibold text-zinc-100">{p.name}</div>
                <StatusBadge tone={tone(p.riskLevel)} dot>
                  {p.riskLevel}
                </StatusBadge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                <span>{p.code}</span>
                <span>·</span>
                <span>{p.status}</span>
                <span>·</span>
                <span>{p.openTickets} tickets</span>
              </div>
              <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${p.progress}%`,
                    background: "linear-gradient(90deg, #FAFAF9, #71717A)",
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
                <span>{formatPercent(p.progress, 0)} progress</span>
                <span>
                  budget {formatPercent((p.actualCost / p.budget) * 100, 0)} used
                </span>
              </div>
            </div>
          </li>
        ))
      )}
    </ul>
  );
}
