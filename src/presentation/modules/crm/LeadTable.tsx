"use client";

import type { Lead } from "@/domain/entities/Lead";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDRCompact } from "@/lib/currency";
import { formatDate } from "@/lib/date";

const STAGE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  "New Lead": "neutral",
  Qualified: "info",
  Discovery: "info",
  "Proposal Sent": "wit",
  Negotiation: "warning",
  Won: "success",
  Lost: "danger",
};

export function LeadTable({ leads }: { leads: Lead[] }) {
  const columns: Column<Lead>[] = [
    {
      key: "company",
      header: "Lead",
      render: (l) => (
        <div>
          <div className="text-xs font-semibold text-zinc-100">{l.companyName}</div>
          <div className="text-[10px] text-zinc-400">{l.contactPerson}</div>
        </div>
      ),
    },
    { key: "source", header: "Source", render: (l) => <span className="text-xs">{l.source}</span> },
    {
      key: "value",
      header: "Deal value",
      align: "right",
      render: (l) => <span className="font-mono text-xs">{formatIDRCompact(l.dealValue)}</span>,
    },
    {
      key: "prob",
      header: "Prob.",
      align: "right",
      render: (l) => <span className="font-mono text-xs">{l.probability}%</span>,
    },
    {
      key: "stage",
      header: "Stage",
      render: (l) => <StatusBadge tone={STAGE_TONE[l.stage]}>{l.stage}</StatusBadge>,
    },
    {
      key: "follow",
      header: "Follow-up",
      render: (l) => <span className="text-[11px] text-zinc-300">{formatDate(l.followUpDate)}</span>,
    },
  ];

  return <DataTable<Lead> columns={columns} rows={leads} rowKey={(l) => l.id} dense />;
}
