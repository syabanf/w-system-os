"use client";

import { Trash2 } from "lucide-react";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import type { Project } from "@/domain/entities/Project";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { BulkActionBar } from "@/presentation/shared/BulkActionBar";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useProjectsStore } from "@/state/projects.store";
import { formatIDRCompact, formatPercent } from "@/lib/currency";

const STATUS_OPTIONS = ["Planning", "Discovery", "In Development", "QA", "UAT", "Delivered", "Maintenance"];
const HEALTH_OPTIONS = ["green", "amber", "red"];

export function ProjectTable({
  rows,
  onRowClick,
}: {
  rows: ProjectOverviewDTO[];
  onRowClick?: (row: ProjectOverviewDTO) => void;
}) {
  const updateProject = useProjectsStore((s) => s.update);
  const removeProject = useProjectsStore((s) => s.remove);
  const sel = useRowSelection();

  const columns: Column<ProjectOverviewDTO>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div>
          <EditableCell
            value={p.name}
            type="text"
            onSave={(v) => updateProject(p.id, { name: v as string })}
            displayClassName="text-xs font-semibold text-zinc-100"
          />
          <div className="px-1 text-[10px] text-zinc-400">{p.code} · {p.clientName}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <EditableCell
          value={p.status}
          type="select"
          options={STATUS_OPTIONS}
          onSave={(v) => updateProject(p.id, { status: v as Project["status"] })}
        />
      ),
    },
    {
      key: "manager",
      header: "PM",
      render: (p) => <span className="text-[11px] text-zinc-300">{p.managerName}</span>,
    },
    {
      key: "progress",
      header: "Progress",
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-white/8">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${p.progress}%`,
                background:
                  p.health === "red"
                    ? "#EF4444"
                    : p.health === "amber"
                      ? "#F59E0B"
                      : "linear-gradient(90deg,#FAFAF9,#71717A)",
              }}
            />
          </div>
          <EditableCell
            value={p.progress}
            type="number"
            onSave={(v) => updateProject(p.id, { progress: v as number })}
            className="w-14"
            displayClassName="font-mono text-[10px] text-zinc-300"
          />
        </div>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      render: (p) => (
        <div className="text-right">
          <div className="font-mono text-[11px] text-zinc-200">{formatIDRCompact(p.budget)}</div>
          <div className="font-mono text-[10px] text-zinc-500">
            {formatPercent(p.budgetUtilization, 0)} used
          </div>
        </div>
      ),
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      render: (p) => (
        <span
          className={`font-mono text-[11px] ${
            p.grossMargin < 5 ? "text-rose-300" : p.grossMargin < 15 ? "text-amber-300" : "text-emerald-300"
          }`}
        >
          {formatPercent(p.grossMargin, 0)}
        </span>
      ),
    },
    {
      key: "health",
      header: "Health",
      render: (p) => (
        <EditableCell
          value={p.health}
          type="select"
          options={HEALTH_OPTIONS}
          onSave={(v) => updateProject(p.id, { health: v as Project["health"] })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <BulkActionBar
        count={sel.count}
        noun="project"
        onClear={sel.clear}
        actions={[
          {
            label: "Delete",
            icon: Trash2,
            tone: "danger",
            onClick: () => {
              [...sel.selectedIds].forEach((id) => removeProject(id));
              sel.clear();
            },
          },
          {
            label: "Mark Delivered",
            onClick: () => {
              [...sel.selectedIds].forEach((id) => updateProject(id, { status: "Delivered" }));
              sel.clear();
            },
          },
        ]}
      />
      <DataTable<ProjectOverviewDTO>
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={onRowClick}
        dense
        selectable
        selectedIds={sel.selectedIds}
        onToggleRow={sel.toggle}
        onToggleAll={sel.toggleAll}
      />
    </div>
  );
}
