"use client";

import type { TeamMember } from "@/domain/entities/TeamMember";
import { Avatar } from "@/presentation/shared/Avatar";
import { StatusBadge } from "@/presentation/shared/StatusBadge";

const AVAIL_TONE: Record<TeamMember["availability"], "success" | "warning" | "danger" | "neutral"> = {
  available: "success",
  busy: "warning",
  overloaded: "danger",
  "on-leave": "neutral",
};

export function ResourceAllocationGrid({ members }: { members: TeamMember[] }) {
  return (
    <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {members.map((m) => (
        <li
          key={m.id}
          className="glass-soft rounded-2xl border border-white/8 p-4 transition-all hover:-translate-y-0.5 hover:border-white/15"
        >
          <div className="flex items-start gap-3">
            <Avatar name={m.name} initials={m.initials} color={m.avatarColor} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold text-zinc-100">{m.name}</div>
                <StatusBadge tone={AVAIL_TONE[m.availability]} dot>
                  {m.availability}
                </StatusBadge>
              </div>
              <div className="text-[11px] text-zinc-400">{m.role}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{m.department}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{m.allocatedHours}h / {m.capacityHours}h</span>
                  <span className="font-mono">{m.allocationPercent}%</span>
                </div>
                <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.min(100, m.allocationPercent)}%`,
                      background:
                        m.allocationPercent > 100
                          ? "#EF4444"
                          : m.allocationPercent > 90
                            ? "linear-gradient(90deg,#F59E0B,#FAFAF9)"
                            : "linear-gradient(90deg,#22C55E,#3B82F6)",
                    }}
                  />
                </div>
                {m.allocationPercent > 100 ? (
                  <div className="mt-1 text-[10px] text-rose-300">
                    Over capacity by {m.allocationPercent - 100}%
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {m.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/8 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
