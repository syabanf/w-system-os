"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Gauge,
  Layers,
  LineChart as LineChartIcon,
  ListChecks,
  ShieldAlert,
  Target,
} from "lucide-react";
import { createSprintService } from "@/application/factories/createSprintService";
import type { SprintSummary } from "@/application/use-cases/tasks/GetSprintSummary";
import type { BurndownPoint } from "@/application/use-cases/tasks/CalculateBurndown";
import type { ProjectBoardDTO } from "@/application/use-cases/tasks/GetProjectBoard";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { SprintKanbanBoard } from "./SprintKanbanBoard";
import { BurndownChart } from "./BurndownChart";
import { SprintVelocityChart } from "./SprintVelocityChart";
import { BacklogTree } from "./BacklogTree";
import { formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

type Tab = "backlog" | "board" | "velocity" | "burndown";

export function SprintTaskView({ compact = false }: { compact?: boolean } = {}) {
  const [summaries, setSummaries] = useState<SprintSummary[]>([]);
  const [board, setBoard] = useState<ProjectBoardDTO | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [burndown, setBurndown] = useState<BurndownPoint[]>([]);
  const [tab, setTab] = useState<Tab>("backlog");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const service = createSprintService();
      const [data, b] = await Promise.all([
        service.getActiveSummaries(),
        service.getProjectBoard(),
      ]);
      if (cancelled) return;
      setSummaries(data);
      setBoard(b);
      const first = data[0];
      if (first) {
        setActiveId(first.sprint.id);
        setBurndown(service.getBurndown(first.sprint));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSummary = summaries.find((s) => s.sprint.id === activeId);

  const onSelect = (id: string) => {
    const s = summaries.find((x) => x.sprint.id === id);
    if (!s) return;
    setActiveId(id);
    setBurndown(createSprintService().getBurndown(s.sprint));
  };

  const totalCommitted = summaries.reduce((s, x) => s + x.sprint.committedPoints, 0);
  const totalCompleted = summaries.reduce((s, x) => s + x.sprint.completedPoints, 0);
  const totalBlockers = summaries.reduce((s, x) => s + x.blockedCount, 0);
  const totalTasks = summaries.reduce((s, x) => s + x.tasks.length, 0);

  return (
    <div className="space-y-5">
      {!compact ? (
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Delivery · Project Board
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Epics, stories, sprints
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Drill from <span className="text-zinc-200">Epic</span> → <span className="text-zinc-200">User Story</span> →{" "}
            <span className="text-zinc-200">Sprint Task</span>. Story points roll up at every level
            and feed velocity + burndown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <ManageMasterDataButton moduleId="projects" />
        </div>
      </header>
      ) : (
        <div className="flex justify-end">
          <TabSwitch tab={tab} onChange={setTab} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Layers}
          label="Total Story Points"
          value={board ? `${board.completedStoryPoints}/${board.totalStoryPoints}` : "—"}
          delta={board ? `${board.inProgressStoryPoints} in flight` : ""}
          trend="up"
        />
        <MetricCard
          icon={Target}
          label="Avg Velocity (6 sprints)"
          value={board ? `${Math.round(board.velocity.averageVelocity)} pt` : "—"}
          delta={
            board
              ? `${Math.round(board.velocity.rolling3)} pt last 3 · ${board.velocity.trend}`
              : ""
          }
          trend={board?.velocity.trend ?? "flat"}
          accent="#FBBF24"
        />
        <MetricCard
          icon={ListChecks}
          label="Active Sprints"
          value={String(summaries.length)}
          delta={`${totalTasks} tasks in flight`}
          accent="#3B82F6"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Blocked Tasks"
          value={String(totalBlockers)}
          trend={totalBlockers > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-4">
        {summaries.map((s) => {
          const isActive = s.sprint.id === activeId;
          return (
            <button
              key={s.sprint.id}
              onClick={() => onSelect(s.sprint.id)}
              className={cn(
                "glass-soft rounded-2xl border p-4 text-left transition-all",
                "hover:-translate-y-0.5",
                isActive ? "border-white/25 bg-white/8" : "border-white/8",
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {s.sprint.startDate} → {s.sprint.endDate}
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">{s.sprint.name}</div>
              <div className="mt-1 text-[11px] text-zinc-400">{s.sprint.goal}</div>
              <div className="mt-3 flex items-center gap-2 text-[10px]">
                <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-zinc-200">
                  {s.sprint.completedPoints}/{s.sprint.committedPoints}pt
                </span>
                {s.blockedCount > 0 ? (
                  <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-rose-300">
                    {s.blockedCount} blocked
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {tab === "backlog" && board ? (
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Backlog"
            title="Epic → User story → Sprint task"
            description="Expand any epic to see its stories with acceptance criteria. Expand a story to see the sprint tasks carved out of it."
          />
          <BacklogTree epics={board.epics} />
        </div>
      ) : null}

      {tab === "board" && activeSummary ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="glass rounded-[20px] p-5 xl:col-span-2">
              <SectionHeader
                eyebrow="Board"
                title={`Scrum board — ${activeSummary.sprint.name}`}
                description={`${activeSummary.tasks.length} tasks across ${Object.keys(activeSummary.byStatus).length} columns`}
              />
              <SprintKanbanBoard tasks={activeSummary.tasks} />
            </div>
            <div className="glass rounded-[20px] p-5">
              <SectionHeader eyebrow="Workload" title="Team workload" />
              <ul className="space-y-2">
                {Object.entries(
                  activeSummary.tasks.reduce<Record<string, number>>((acc, t) => {
                    acc[t.assigneeId] = (acc[t.assigneeId] ?? 0) + t.storyPoints;
                    return acc;
                  }, {}),
                ).map(([assigneeId, points]) => {
                  const member = teamMap.get(assigneeId);
                  return (
                    <li
                      key={assigneeId}
                      className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
                    >
                      <span className="truncate text-xs text-zinc-200">
                        {member?.name ?? "Unknown"}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="relative h-1 w-16 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${Math.min(100, points * 6)}%`,
                              background: "linear-gradient(90deg, #FAFAF9, #71717A)",
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400">{points}pt</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      ) : null}

      {tab === "velocity" && board ? (
        <>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <MetricCard
              label="3-sprint avg"
              value={`${Math.round(board.velocity.rolling3)} pt`}
              accent="#34D399"
            />
            <MetricCard
              label="6-sprint avg"
              value={`${Math.round(board.velocity.rolling6)} pt`}
              accent="#FBBF24"
            />
            <MetricCard
              icon={CheckCircle2}
              label="This sprint commitment"
              value={`${board.velocity.history.at(-1)?.committed ?? 0} pt`}
              accent="#3B82F6"
            />
            <MetricCard
              icon={Gauge}
              label="Velocity trend"
              value={board.velocity.trend}
              trend={board.velocity.trend}
              accent="#A1A1AA"
            />
          </div>
          <ChartCard
            title="Sprint velocity — last 6 sprints"
            description="Committed (blue) vs completed (green) story points. Amber line marks the rolling average."
            height={280}
          >
            <SprintVelocityChart
              history={board.velocity.history}
              averageVelocity={board.velocity.averageVelocity}
            />
          </ChartCard>
          <div className="glass rounded-[20px] p-5">
            <SectionHeader
              eyebrow="History"
              title="Sprint-by-sprint"
              description="Detailed velocity ledger."
            />
            <ul className="grid gap-1.5 md:grid-cols-2">
              {board.velocity.history.map((v) => {
                const completion =
                  v.committed > 0 ? Math.round((v.completed / v.committed) * 100) : 0;
                return (
                  <li
                    key={v.sprintCode}
                    className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2"
                  >
                    <span className="col-span-3 text-xs font-semibold text-zinc-100">
                      {v.sprintLabel}
                    </span>
                    <span className="col-span-4 text-[10px] text-zinc-400">
                      {v.startDate} → {v.endDate}
                    </span>
                    <span className="col-span-2 text-right font-mono text-[11px] text-zinc-300">
                      {v.completed}/{v.committed} pt
                    </span>
                    <span
                      className={cn(
                        "col-span-3 text-right font-mono text-[11px]",
                        completion >= 100
                          ? "text-emerald-300"
                          : completion >= 80
                            ? "text-amber-300"
                            : "text-rose-300",
                      )}
                    >
                      {completion}% delivered
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}

      {tab === "burndown" && activeSummary ? (
        <ChartCard
          title={`Burndown — ${activeSummary.sprint.name}`}
          description="Ideal vs. actual story-point burndown for the selected sprint."
          height={320}
        >
          <BurndownChart data={burndown} />
        </ChartCard>
      ) : null}
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: "backlog", label: "Backlog", icon: Layers },
    { id: "board", label: "Sprint Board", icon: ListChecks },
    { id: "velocity", label: "Velocity", icon: Target },
    { id: "burndown", label: "Burndown", icon: LineChartIcon },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors",
              tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            <Icon className="h-3 w-3" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
