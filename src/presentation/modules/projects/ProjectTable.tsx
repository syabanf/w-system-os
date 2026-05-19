"use client";

import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDRCompact, formatPercent } from "@/lib/currency";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Discovery: "info",
  Planning: "info",
  "In Development": "wit",
  QA: "warning",
  UAT: "warning",
  Delivered: "success",
  Maintenance: "neutral",
};

const HEALTH_TONE = {
  green: "success" as const,
  amber: "warning" as const,
  red: "danger" as const,
};

export function ProjectTable({
  rows,
  onRowClick,
}: {
  rows: ProjectOverviewDTO[];
  onRowClick?: (row: ProjectOverviewDTO) => void;
}) {
  const columns: Column<ProjectOverviewDTO>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div>
          <div className="text-xs font-semibold text-zinc-100">{p.name}</div>
          <div className="text-[10px] text-zinc-400">{p.code} · {p.clientName}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge tone={STATUS_TONE[p.status]}>{p.status}</StatusBadge>,
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
          <span className="font-mono text-[10px] text-zinc-300">{p.progress}%</span>
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
        <StatusBadge tone={HEALTH_TONE[p.health]} dot>
          {p.health}
        </StatusBadge>
      ),
    },
  ];

  return (
    <DataTable<ProjectOverviewDTO>
      columns={columns}
      rows={rows}
      rowKey={(p) => p.id}
      onRowClick={onRowClick}
      dense
    />
  );
}
