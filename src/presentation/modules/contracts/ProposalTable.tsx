"use client";

import type { Proposal } from "@/domain/entities/Proposal";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDRCompact } from "@/lib/currency";
import { formatDate } from "@/lib/date";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  drafting: "neutral",
  sent: "info",
  "in-review": "warning",
  approved: "success",
  rejected: "danger",
  expired: "neutral",
};

export function ProposalTable({ rows }: { rows: Proposal[] }) {
  const columns: Column<Proposal>[] = [
    {
      key: "number",
      header: "Proposal",
      render: (p) => (
        <div>
          <div className="text-xs font-semibold text-zinc-100">{p.title}</div>
          <div className="font-mono text-[10px] text-zinc-400">{p.number}</div>
        </div>
      ),
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      render: (p) => <span className="font-mono text-xs">{formatIDRCompact(p.value)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge tone={STATUS_TONE[p.status]}>{p.status}</StatusBadge>,
    },
    {
      key: "approval",
      header: "Approval",
      render: (p) => <span className="text-[11px] text-zinc-300">{p.approvalStage}</span>,
    },
    {
      key: "signature",
      header: "Signature",
      render: (p) => (
        <StatusBadge
          tone={
            p.signatureStatus === "fully-signed"
              ? "success"
              : p.signatureStatus === "client-signed"
                ? "info"
                : "neutral"
          }
        >
          {p.signatureStatus}
        </StatusBadge>
      ),
    },
    {
      key: "expiry",
      header: "Expires",
      render: (p) => <span className="text-[11px] text-zinc-300">{formatDate(p.expiryDate)}</span>,
    },
  ];

  return <DataTable<Proposal> columns={columns} rows={rows} rowKey={(r) => r.id} dense />;
}
