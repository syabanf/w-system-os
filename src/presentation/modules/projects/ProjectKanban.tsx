"use client";

import { PROJECT_STATUSES } from "@/domain/value-objects/ProjectStatus";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDRCompact } from "@/lib/currency";

const HEALTH_TONE = {
  green: "success" as const,
  amber: "warning" as const,
  red: "danger" as const,
};

export function ProjectKanban({
  projects,
  onCardClick,
}: {
  projects: ProjectOverviewDTO[];
  onCardClick?: (project: ProjectOverviewDTO) => void;
}) {
  return (
    <div className="glass-scroll -mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-3 px-1">
        {PROJECT_STATUSES.map((status) => {
          const items = projects.filter((p) => p.status === status);
          return (
            <div
              key={status}
              className="w-[240px] shrink-0 rounded-2xl border border-white/8 bg-white/[0.025] p-3"
            >
              <header className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100">{status}</span>
                <span className="rounded-full bg-white/8 px-1.5 text-[10px] text-zinc-300">
                  {items.length}
                </span>
              </header>
              <ul className="space-y-2">
                {items.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[10px] text-zinc-500">
                    —
                  </li>
                ) : (
                  items.map((p) => (
                    <li
                      key={p.id}
                      onClick={onCardClick ? () => onCardClick(p) : undefined}
                      className="glass-soft cursor-pointer rounded-xl border border-white/6 p-3 transition-all hover:-translate-y-0.5 hover:border-white/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-mono text-zinc-400">{p.code}</span>
                        <StatusBadge tone={HEALTH_TONE[p.health]} dot>
                          {p.health}
                        </StatusBadge>
                      </div>
                      <div className="mt-1 truncate text-xs font-semibold text-zinc-100">
                        {p.name}
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-400">{p.clientName}</div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-300">
                        <span>{p.progress}%</span>
                        <span className="font-mono">{formatIDRCompact(p.budget)}</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
