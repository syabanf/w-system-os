"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProjectMilestones } from "@/state/milestones.store";
import type {
  MilestoneSection,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import { cn } from "@/lib/cn";

interface MilestoneCalendarProps {
  projectId: string;
}

const SECTION_COLOR: Record<MilestoneSection, string> = {
  workflow: "#60A5FA",
  payment: "#F59E0B",
  credential: "#A855F7",
  development: "#34D399",
};

const SECTION_LABEL: Record<MilestoneSection, string> = {
  workflow: "Workflow",
  payment: "Payment",
  credential: "Credential",
  development: "Development",
};

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** ISO month grid that starts on Monday. Returns 6 rows × 7 columns of Date
 *  cells so the calendar height stays stable across months. */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // JS getDay: 0 = Sunday → shift to Monday-first.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MilestoneCalendar({ projectId }: MilestoneCalendarProps) {
  const milestones = useProjectMilestones(projectId);
  const today = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  // Index milestones by ISO yyyy-mm-dd for O(1) day lookup.
  const byDay = useMemo(() => {
    const map = new Map<string, ProjectMilestone[]>();
    for (const m of milestones) {
      if (!m.dueDate) continue;
      const key = m.dueDate.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return map;
  }, [milestones]);

  const monthLabel = cursor.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="glass rounded-[20px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Calendar
          </div>
          <div className="text-sm font-semibold text-zinc-50">{monthLabel}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
            aria-label="Previous month"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-300 hover:bg-white/10 hover:text-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
            aria-label="Next month"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-50"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const key = d.toISOString().slice(0, 10);
          const items = byDay.get(key) ?? [];
          const isToday = sameDay(d, today);
          return (
            <div
              key={key}
              className={cn(
                "min-h-[58px] rounded-lg border border-white/6 p-1.5 text-left transition-colors",
                inMonth ? "bg-white/[0.02]" : "bg-transparent opacity-50",
                isToday && "ring-1 ring-cyan-400/60",
              )}
            >
              <div
                className={cn(
                  "text-[10px] font-mono",
                  inMonth ? "text-zinc-300" : "text-zinc-500",
                )}
              >
                {d.getDate()}
              </div>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {items.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    title={`${SECTION_LABEL[m.section]}: ${m.label}`}
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ background: SECTION_COLOR[m.section] }}
                  />
                ))}
                {items.length > 4 ? (
                  <span className="text-[8px] text-zinc-400">
                    +{items.length - 4}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400">
        {(Object.keys(SECTION_LABEL) as MilestoneSection[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: SECTION_COLOR[s] }}
            />
            {SECTION_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
