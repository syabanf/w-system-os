"use client";

import { useEffect, useMemo } from "react";
import type { Quotation } from "@/domain/entities/Quotation";
import { useQuotationsStore } from "@/state/quotations.store";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge, type StatusTone } from "@/presentation/shared/StatusBadge";

interface QuotationMiniListProps {
  projectId: string;
}

const STATUS_TONE: Record<Quotation["status"], StatusTone> = {
  draft: "neutral",
  sent: "info",
  accepted: "success",
  rejected: "danger",
  expired: "warning",
};

function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString();
}

export function QuotationMiniList({ projectId }: QuotationMiniListProps) {
  const all = useQuotationsStore((s) => s.items);
  const hydrate = useQuotationsStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const quotations = useMemo(
    () => all.filter((q) => q.projectId === projectId),
    [all, projectId],
  );

  const columns: Column<Quotation>[] = [
    {
      key: "number",
      header: "Quote",
      render: (q) => (
        <span className="font-mono text-xs text-zinc-100">{q.number}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (q) => <span className="text-[11px] text-zinc-200">{q.title}</span>,
    },
    {
      key: "valid",
      header: "Valid until",
      render: (q) => (
        <span className="text-[11px] text-zinc-300">{q.validUntil}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (q) => (
        <span className="font-mono text-xs text-zinc-200">
          {q.currency} {formatIDR(q.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (q) => (
        <StatusBadge tone={STATUS_TONE[q.status]}>{q.status}</StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Quotation List
          </div>
          <div className="text-sm font-semibold text-zinc-50">
            {quotations.length} quotation{quotations.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <DataTable<Quotation>
        columns={columns}
        rows={quotations}
        rowKey={(q) => q.id}
        dense
        empty="No quotations for this project yet."
      />
    </div>
  );
}
