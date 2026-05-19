"use client";

import type { TimesheetSummary } from "@/application/use-cases/timesheet/GetTimesheetSummary";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { Avatar } from "@/presentation/shared/Avatar";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function WeeklyTimesheetGrid({ summary }: { summary: TimesheetSummary }) {
  const days = summary.byDay.map((d) => d.date);

  const byMember: Record<string, Record<string, { hours: number; billable: number }>> = {};
  for (const e of summary.entries) {
    byMember[e.memberId] = byMember[e.memberId] ?? {};
    const cur = byMember[e.memberId][e.date] ?? { hours: 0, billable: 0 };
    cur.hours += e.hours;
    if (e.billable) cur.billable += e.hours;
    byMember[e.memberId][e.date] = cur;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-zinc-400">
          <tr>
            <th className="px-3 py-2.5">Member</th>
            {days.map((d) => (
              <th key={d} className="px-3 py-2.5 text-center">
                {new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit" })}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byMember).map(([memberId, perDay], rowIdx) => {
            const member = teamMap.get(memberId);
            const total = Object.values(perDay).reduce((s, v) => s + v.hours, 0);
            return (
              <tr
                key={memberId}
                className={`border-t border-white/5 transition-colors hover:bg-white/[0.04] ${
                  rowIdx % 2 === 1 ? "bg-white/[0.015]" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {member ? (
                      <Avatar name={member.name} initials={member.initials} color={member.avatarColor} size="sm" />
                    ) : null}
                    <span className="text-zinc-100">{member?.name ?? "Unknown"}</span>
                  </div>
                </td>
                {days.map((d) => {
                  const v = perDay[d];
                  if (!v) return <td key={d} className="px-3 py-2 text-center text-zinc-600">·</td>;
                  return (
                    <td key={d} className="px-3 py-2 text-center">
                      <div className="font-mono text-zinc-200">{v.hours}h</div>
                      <div className="text-[9px] uppercase text-emerald-400/70">
                        {v.billable}h billable
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <span className="font-mono text-zinc-100">{total}h</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
