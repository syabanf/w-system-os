"use client";

import { TASK_STATUSES, type Task } from "@/domain/entities/Task";
import { Avatar } from "@/presentation/shared/Avatar";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { ShieldAlert } from "lucide-react";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

const PRIORITY_TONE: Record<string, string> = {
  low: "#A1A1AA",
  medium: "#3B82F6",
  high: "#F59E0B",
  critical: "#EF4444",
};

interface KanbanProps {
  tasks: Task[];
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
}

export function SprintKanbanBoard({ tasks, onEdit, onDelete }: KanbanProps) {
  return (
    <div className="glass-scroll -mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-3 px-1">
        {TASK_STATUSES.map((status) => {
          const items = tasks.filter((t) => t.status === status);
          const points = items.reduce((s, t) => s + t.storyPoints, 0);
          return (
            <div
              key={status}
              className="w-[240px] shrink-0 rounded-2xl border border-white/8 bg-white/[0.025] p-3"
            >
              <header className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100">{status}</span>
                <span className="rounded-full bg-white/8 px-1.5 text-[10px] text-zinc-300">
                  {items.length} · {points}pt
                </span>
              </header>
              <ul className="space-y-2">
                {items.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[10px] text-zinc-500">
                    —
                  </li>
                ) : (
                  items.map((t) => {
                    const assignee = teamMap.get(t.assigneeId);
                    return (
                      <li
                        key={t.id}
                        onClick={() => onEdit?.(t)}
                        className="glass-soft group cursor-pointer rounded-xl border border-white/6 p-3 transition-all hover:-translate-y-0.5 hover:border-white/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-zinc-400">{t.code}</span>
                          <div className="flex items-center gap-1">
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                              style={{
                                background: `${PRIORITY_TONE[t.priority]}20`,
                                color: PRIORITY_TONE[t.priority],
                              }}
                            >
                              {t.priority}
                            </span>
                            {onDelete ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(t);
                                }}
                                aria-label="Delete task"
                                className="grid h-5 w-5 place-items-center rounded-md text-zinc-400 transition-all hover:bg-rose-500/15 hover:text-rose-300"
                              >
                                ×
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-zinc-100">{t.title}</div>
                        {t.blocked ? (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-1.5 py-0.5 text-[9px] text-rose-300">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            Blocked
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar
                                name={assignee.name}
                                initials={assignee.initials}
                                color={assignee.avatarColor}
                                size="sm"
                              />
                              <span className="text-[10px] text-zinc-300">{assignee.name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Unassigned</span>
                          )}
                          <span className="font-mono text-[10px] text-zinc-400">{t.storyPoints}pt</span>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
