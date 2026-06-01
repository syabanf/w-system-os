"use client";

import { useMemo } from "react";
import { mockInvoices } from "@/infrastructure/data/invoices.mock";
import type { Invoice } from "@/domain/entities/Invoice";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge, type StatusTone } from "@/presentation/shared/StatusBadge";

interface InvoiceMiniListProps {
  clientId: string;
}

const STATUS_TONE: Record<Invoice["status"], StatusTone> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString();
}

export function InvoiceMiniList({ clientId }: InvoiceMiniListProps) {
  const invoices = useMemo(
    () => mockInvoices.filter((i) => i.clientId === clientId),
    [clientId],
  );

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "Invoice",
      render: (i) => (
        <span className="font-mono text-xs text-zinc-100">{i.number}</span>
      ),
    },
    {
      key: "issued",
      header: "Issued",
      render: (i) => <span className="text-[11px] text-zinc-300">{i.issueDate}</span>,
    },
    {
      key: "due",
      header: "Due",
      render: (i) => <span className="text-[11px] text-zinc-300">{i.dueDate}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (i) => (
        <span className="font-mono text-xs text-zinc-200">
          {i.currency} {formatIDR(i.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (i) => (
        <StatusBadge tone={STATUS_TONE[i.status]}>{i.status}</StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Invoice List
          </div>
          <div className="text-sm font-semibold text-zinc-50">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <DataTable<Invoice>
        columns={columns}
        rows={invoices}
        rowKey={(i) => i.id}
        dense
        empty="No invoices for this client yet."
      />
    </div>
  );
}
