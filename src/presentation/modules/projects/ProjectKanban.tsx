"use client";

import { useEffect, useState } from "react";
import { PROJECT_STATUSES, type ProjectStatus } from "@/domain/value-objects/ProjectStatus";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { useProjectsStore } from "@/state/projects.store";
import { useToast } from "@/state/toast.store";
import { formatIDRCompact } from "@/lib/currency";
import { cn } from "@/lib/cn";

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
  // Local board state seeded from the prop. The prop is derived upstream (not the
  // store directly), so it won't update after a move — we mutate `board` locally
  // and persist intent to the store separately (mirrors LeadPipelineBoard).
  const [board, setBoard] = useState<ProjectOverviewDTO[]>(projects);
  // Which column is currently a valid drop target (for the hover highlight).
  const [dropTarget, setDropTarget] = useState<ProjectStatus | null>(null);

  const updateProject = useProjectsStore((s) => s.update);
  const toast = useToast();

  // Re-sync if the upstream prop changes.
  useEffect(() => setBoard(projects), [projects]);

  const moveProject = (projectId: string, toStatus: ProjectStatus) => {
    setBoard((prev) => {
      const project = prev.find((p) => p.id === projectId);
      if (!project || project.status === toStatus) return prev; // no-op drop

      // Persist intent to the store + notify.
      updateProject(projectId, { status: toStatus });
      toast.success("Project moved", `${project.name} → ${toStatus}`);

      return prev.map((p) => (p.id === projectId ? { ...p, status: toStatus } : p));
    });
  };

  return (
    <div className="glass-scroll -mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-3 px-1">
        {PROJECT_STATUSES.map((status) => {
          const items = board.filter((p) => p.status === status);
          const isDropTarget = dropTarget === status;
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dropTarget !== status) setDropTarget(status);
              }}
              onDragLeave={(e) => {
                // Only clear when leaving the column itself, not its children.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setDropTarget((cur) => (cur === status ? null : cur));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const projectId = e.dataTransfer.getData("text/project");
                if (projectId) moveProject(projectId, status);
              }}
              className={cn(
                "w-[240px] shrink-0 rounded-2xl border p-3 transition-colors",
                isDropTarget
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-white/8 bg-white/[0.025]",
              )}
            >
              <header className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100">{status}</span>
                <span className="rounded-full bg-white/8 px-1.5 text-[10px] text-zinc-300">
                  {items.length}
                </span>
              </header>
              <ul className="space-y-2">
                {items.length === 0 ? (
                  <li
                    className={cn(
                      "rounded-xl border border-dashed p-3 text-center text-[10px] transition-colors",
                      isDropTarget
                        ? "border-white/30 text-zinc-300"
                        : "border-white/8 text-zinc-500",
                    )}
                  >
                    {isDropTarget ? "Drop here" : "—"}
                  </li>
                ) : (
                  items.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onCardClick={onCardClick}
                    />
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

/** A single draggable kanban card. A plain click (no drag) drills into the project. */
function ProjectCard({
  project: p,
  onCardClick,
}: {
  project: ProjectOverviewDTO;
  onCardClick?: (project: ProjectOverviewDTO) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <li
      draggable
      onClick={onCardClick ? () => onCardClick(p) : undefined}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/project", p.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "glass-soft cursor-pointer rounded-xl border border-white/6 p-3 transition-all hover:-translate-y-0.5 hover:border-white/20",
        dragging && "opacity-40",
      )}
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
  );
}
