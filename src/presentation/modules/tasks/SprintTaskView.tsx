"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Gauge,
  Layers,
  LineChart as LineChartIcon,
  ListChecks,
  Pencil,
  ShieldAlert,
  Target,
  Trash2,
} from "lucide-react";
import { createSprintService } from "@/application/factories/createSprintService";
import type { SprintSummary } from "@/application/use-cases/tasks/GetSprintSummary";
import type { BurndownPoint } from "@/application/use-cases/tasks/CalculateBurndown";
import type { ProjectBoardDTO } from "@/application/use-cases/tasks/GetProjectBoard";
import type { Sprint } from "@/domain/entities/Sprint";
import type { Task } from "@/domain/entities/Task";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { NewButton } from "@/presentation/shared/NewButton";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { SprintKanbanBoard } from "./SprintKanbanBoard";
import { BurndownChart } from "./BurndownChart";
import { SprintVelocityChart } from "./SprintVelocityChart";
import { BacklogTree } from "./BacklogTree";
import { SprintFormDialog } from "./SprintFormDialog";
import { TaskFormDialog } from "./TaskFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useSprintsStore } from "@/state/sprints.store";
import { useTasksStore } from "@/state/tasks.store";
import { useToast } from "@/state/toast.store";
import { useHotkey } from "@/hooks/useHotkey";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

type Tab = "backlog" | "board" | "velocity" | "burndown";

export function SprintTaskView({ compact = false }: { compact?: boolean } = {}) {
  const [summaries, setSummaries] = useState<SprintSummary[]>([]);
  const [board, setBoard] = useState<ProjectBoardDTO | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [burndown, setBurndown] = useState<BurndownPoint[]>([]);
  const [tab, setTab] = useState<Tab>("backlog");

  // CRUD stores layered on top of the DTOs. Sprints + Tasks remain visible via
  // the service-computed summaries (velocity, burndown, etc.), but new + edited
  // records appear in the picker, board, and backlog via the merge below.
  const sprints = useSprintsStore((s) => s.items);
  const hydrateSprints = useSprintsStore((s) => s.hydrate);
  const addSprint = useSprintsStore((s) => s.add);
  const updateSprint = useSprintsStore((s) => s.update);
  const removeSprint = useSprintsStore((s) => s.remove);

  const tasks = useTasksStore((s) => s.items);
  const hydrateTasks = useTasksStore((s) => s.hydrate);
  const addTask = useTasksStore((s) => s.add);
  const updateTask = useTasksStore((s) => s.update);
  const removeTask = useTasksStore((s) => s.remove);

  const toast = useToast();

  const [sprintFormOpen, setSprintFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [confirmDeleteSprint, setConfirmDeleteSprint] = useState<Sprint | null>(null);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);

  // ⌘N — context-aware: planning a sprint when on Velocity/Backlog, adding a
  // task when a sprint is actively selected on the Board.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    if (tab === "board" && activeId) {
      setEditingTask(null);
      setTaskFormOpen(true);
    } else {
      setEditingSprint(null);
      setSprintFormOpen(true);
    }
  });

  useEffect(() => {
    hydrateSprints();
    hydrateTasks();
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
  }, [hydrateSprints, hydrateTasks]);

  // Surface store-only sprints (created since page load) in the picker cards.
  // The seed mock IDs collide with `summaries` IDs so the union de-dupes by id.
  const storeSprintsById = new Map(sprints.map((s) => [s.id, s]));
  const summaryIds = new Set(summaries.map((s) => s.sprint.id));
  const extraSprints: Sprint[] = sprints.filter((s) => !summaryIds.has(s.id) && s.status !== "completed");
  void storeSprintsById;

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
          <NewButton
            label="New sprint"
            size="sm"
            onClick={() => {
              setEditingSprint(null);
              setSprintFormOpen(true);
            }}
          />
          {tab === "board" && activeId ? (
            <NewButton
              label="New task"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setTaskFormOpen(true);
              }}
            />
          ) : null}
          <ManageMasterDataButton moduleId="projects" />
        </div>
      </header>
      ) : (
        <div className="flex justify-end gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <NewButton
            label="New sprint"
            size="sm"
            onClick={() => {
              setEditingSprint(null);
              setSprintFormOpen(true);
            }}
          />
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
        {[...summaries.map((s) => s.sprint), ...extraSprints].map((sprint) => {
          // The store may have a newer version of any sprint that's also in
          // the DTO summaries — prefer the store record for display fields.
          const overrides = storeSprintsById.get(sprint.id);
          const s = overrides ?? sprint;
          const isActive = s.id === activeId;
          const matched = summaries.find((x) => x.sprint.id === s.id);
          const blockedCount = matched?.blockedCount ?? 0;
          return (
            <div
              key={s.id}
              className={cn(
                "glass-soft group relative rounded-2xl border p-4 text-left transition-all",
                "hover:-translate-y-0.5",
                isActive ? "border-white/25 bg-white/8" : "border-white/8",
              )}
            >
              <button
                onClick={() => onSelect(s.id)}
                className="block w-full text-left"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {s.startDate} → {s.endDate}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-zinc-100">{s.name}</div>
                <div className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{s.goal}</div>
                <div className="mt-3 flex items-center gap-2 text-[10px]">
                  <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-zinc-200">
                    {s.completedPoints}/{s.committedPoints}pt
                  </span>
                  {blockedCount > 0 ? (
                    <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-rose-300">
                      {blockedCount} blocked
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5",
                      s.status === "active"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : s.status === "completed"
                          ? "bg-white/8 text-zinc-300"
                          : "bg-amber-500/15 text-amber-300",
                    )}
                  >
                    {s.status}
                  </span>
                </div>
              </button>
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSprint(s);
                    setSprintFormOpen(true);
                  }}
                  aria-label="Edit sprint"
                  className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteSprint(s);
                  }}
                  aria-label="Delete sprint"
                  className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
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
              <SprintKanbanBoard
                tasks={activeSummary.tasks}
                onEdit={(t) => {
                  setEditingTask(t);
                  setTaskFormOpen(true);
                }}
                onDelete={setConfirmDeleteTask}
              />
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

      <SprintFormDialog
        open={sprintFormOpen}
        editing={editingSprint}
        onClose={() => setSprintFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateSprint(editingId, draft);
            toast.success("Sprint updated", draft.name);
          } else {
            const created = addSprint(draft);
            setActiveId(created.id);
            toast.success("Sprint planned", `${draft.name} · ${draft.committedPoints}pt committed`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeleteSprint}
        title="Cancel & remove sprint?"
        description={
          confirmDeleteSprint
            ? `${confirmDeleteSprint.name} (${confirmDeleteSprint.committedPoints}pt committed) will be removed from the board. Tasks assigned to this sprint move back to the backlog.`
            : ""
        }
        onCancel={() => setConfirmDeleteSprint(null)}
        onConfirm={() => {
          if (!confirmDeleteSprint) return;
          const name = confirmDeleteSprint.name;
          removeSprint(confirmDeleteSprint.id);
          setConfirmDeleteSprint(null);
          setActiveId(null);
          toast.info("Sprint removed", `${name} has been archived.`);
        }}
      />

      <TaskFormDialog
        open={taskFormOpen}
        defaultSprintId={activeId ?? undefined}
        editing={editingTask}
        onClose={() => setTaskFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateTask(editingId, draft);
            toast.success("Task updated", draft.title);
          } else {
            const created = addTask(draft);
            toast.success("Task added", `${created.code} · ${draft.title}`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeleteTask}
        title="Remove task?"
        description={
          confirmDeleteTask
            ? `${confirmDeleteTask.code} · ${confirmDeleteTask.title} (${confirmDeleteTask.storyPoints}pt) will be removed from the sprint. Comments and time entries are preserved.`
            : ""
        }
        onCancel={() => setConfirmDeleteTask(null)}
        onConfirm={() => {
          if (!confirmDeleteTask) return;
          const ref = `${confirmDeleteTask.code} · ${confirmDeleteTask.title}`;
          removeTask(confirmDeleteTask.id);
          setConfirmDeleteTask(null);
          toast.info("Task removed", ref);
        }}
      />
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
