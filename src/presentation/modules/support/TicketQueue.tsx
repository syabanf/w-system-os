"use client";

import type { EnrichedTicket } from "@/application/use-cases/support/GetTicketSLAOverview";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";

const SEVERITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  low: "info",
  medium: "warning",
  high: "warning",
  critical: "danger",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Open: "danger",
  Investigating: "warning",
  "Waiting Client": "info",
  "In Progress": "wit",
  Resolved: "success",
  Closed: "neutral",
};

export function TicketQueue({
  rows,
  onRowClick,
}: {
  rows: EnrichedTicket[];
  onRowClick?: (t: EnrichedTicket) => void;
}) {
  const columns: Column<EnrichedTicket>[] = [
    {
      key: "title",
      header: "Ticket",
      render: (t) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-400">{t.code}</span>
            {t.isChangeRequest ? (
              <StatusBadge tone="info">CR</StatusBadge>
            ) : null}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-zinc-100">{t.title}</div>
          <div className="text-[10px] text-zinc-400">{t.clientName} · {t.projectName}</div>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (t) => <StatusBadge tone={SEVERITY_TONE[t.severity]} dot>{t.severity}</StatusBadge>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge tone={STATUS_TONE[t.status]}>{t.status}</StatusBadge>,
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (t) => <span className="text-[11px] text-zinc-300">{t.assigneeName}</span>,
    },
    {
      key: "sla",
      header: "SLA",
      align: "right",
      render: (t) => {
        if (t.status === "Resolved" || t.status === "Closed")
          return <span className="text-[11px] text-zinc-500">—</span>;
        if (t.isBreached) {
          return (
            <span className="font-mono text-[11px] text-rose-300">
              {`${Math.abs(Math.round(t.hoursUntilSLA))}h overdue`}
            </span>
          );
        }
        if (t.isAtRisk) {
          return (
            <span className="font-mono text-[11px] text-amber-300">
              {`${Math.round(t.hoursUntilSLA * 10) / 10}h left`}
            </span>
          );
        }
        return (
          <span className="font-mono text-[11px] text-emerald-300">
            {`${Math.round(t.hoursUntilSLA)}h left`}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable<EnrichedTicket>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      onRowClick={onRowClick}
      dense
    />
  );
}
