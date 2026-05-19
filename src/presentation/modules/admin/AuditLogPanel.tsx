"use client";

import type { AuditLogEntry } from "@/domain/entities/User";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { Avatar } from "@/presentation/shared/Avatar";
import { relativeFromNow } from "@/lib/date";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function AuditLogPanel({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const actor = teamMap.get(entry.actorId);
        return (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
          >
            {actor ? (
              <Avatar name={actor.name} initials={actor.initials} color={actor.avatarColor} size="sm" />
            ) : (
              <span className="h-7 w-7" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] leading-snug text-zinc-200">
                <span className="font-semibold text-zinc-50">{actor?.name ?? "System"}</span> {entry.action}{" "}
                <span className="text-zinc-400">— {entry.target}</span>
              </div>
              <div className="text-[10px] text-zinc-500">{relativeFromNow(entry.at)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
