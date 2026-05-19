"use client";

import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";

function dayDelta(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

export function ProjectRoadmap({
  projects,
  onRowClick,
}: {
  projects: ProjectOverviewDTO[];
  onRowClick?: (project: ProjectOverviewDTO) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No projects.
      </div>
    );
  }

  const minStart = projects.reduce(
    (min, p) => (p.startDate < min ? p.startDate : min),
    projects[0].startDate,
  );
  const maxEnd = projects.reduce(
    (max, p) => (p.endDate > max ? p.endDate : max),
    projects[0].endDate,
  );
  const totalDays = Math.max(1, dayDelta(minStart, maxEnd));

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <div className="mb-2 grid grid-cols-12 text-[10px] uppercase tracking-wider text-zinc-500">
        <span className="col-span-3">Project</span>
        <span className="col-span-9">Timeline · {minStart} → {maxEnd}</span>
      </div>
      <ul className="space-y-1.5">
        {projects.map((p) => {
          const offsetPct = (dayDelta(minStart, p.startDate) / totalDays) * 100;
          const widthPct = Math.max(2, (dayDelta(p.startDate, p.endDate) / totalDays) * 100);
          const progressPct = (widthPct * p.progress) / 100;
          const accent =
            p.health === "red" ? "#EF4444" : p.health === "amber" ? "#F59E0B" : "#FAFAF9";

          return (
            <li
              key={p.id}
              onClick={onRowClick ? () => onRowClick(p) : undefined}
              className={`grid grid-cols-12 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.03] ${onRowClick ? "cursor-pointer" : ""}`}
            >
              <div className="col-span-3 min-w-0">
                <div className="truncate text-xs font-semibold text-zinc-100">{p.name}</div>
                <div className="text-[10px] text-zinc-500">{p.code} · {p.status}</div>
              </div>
              <div className="relative col-span-9 h-5">
                <div
                  className="absolute top-1.5 h-2 rounded-full bg-white/8"
                  style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
                />
                <div
                  className="absolute top-1.5 h-2 rounded-full"
                  style={{
                    left: `${offsetPct}%`,
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                    boxShadow: `0 0 12px -2px ${accent}88`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
