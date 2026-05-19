"use client";

import type { FinanceOverviewDTO } from "@/application/dtos/FinanceDTO";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDR } from "@/lib/currency";
import { formatDate } from "@/lib/date";

type InvoiceRow = FinanceOverviewDTO["invoices"][number];

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

export function InvoiceTable({ rows }: { rows: InvoiceRow[] }) {
  const columns: Column<InvoiceRow>[] = [
    {
      key: "no",
      header: "Invoice",
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.clientName}</div>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (r) => <span className="text-[11px] text-zinc-300">{r.projectName}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => <span className="font-mono text-xs text-zinc-200">{formatIDR(r.amount)}</span>,
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      render: (r) => (
        <span
          className={`font-mono text-xs ${
            r.paidAmount >= r.amount ? "text-emerald-300" : r.paidAmount > 0 ? "text-amber-300" : "text-rose-300"
          }`}
        >
          {formatIDR(r.paidAmount)}
        </span>
      ),
    },
    {
      key: "issue",
      header: "Issue",
      render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.issueDate)}</span>,
    },
    {
      key: "due",
      header: "Due",
      render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.dueDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge tone={STATUS_TONE[r.status]}>{r.status}</StatusBadge>,
    },
  ];

  return <DataTable<InvoiceRow> columns={columns} rows={rows} rowKey={(r) => r.id} dense />;
}
