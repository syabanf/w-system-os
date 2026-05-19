"use client";

import type { PipelineStage } from "@/application/use-cases/crm/GetSalesPipeline";
import { formatIDRCompact } from "@/lib/currency";
import { cn } from "@/lib/cn";

const STAGE_ACCENT: Record<string, string> = {
  "New Lead": "#A1A1AA",
  Qualified: "#3B82F6",
  Discovery: "#06B6D4",
  "Proposal Sent": "#A855F7",
  Negotiation: "#F59E0B",
  Won: "#22C55E",
  Lost: "#EF4444",
};

export function LeadPipelineBoard({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="glass-scroll -mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3 px-1">
        {stages.map((column) => {
          const accent = STAGE_ACCENT[column.stage] ?? "#FAFAF9";
          return (
            <div
              key={column.stage}
              className="w-[260px] shrink-0 rounded-2xl border border-white/8 bg-white/[0.025] p-3"
            >
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: accent, boxShadow: `0 0 10px ${accent}88` }}
                  />
                  <span className="text-xs font-semibold text-zinc-100">{column.stage}</span>
                  <span className="rounded-full bg-white/8 px-1.5 text-[10px] text-zinc-300">
                    {column.leads.length}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500">{formatIDRCompact(column.totalValue)}</div>
              </header>
              <ul className="space-y-2">
                {column.leads.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[10px] text-zinc-500">
                    Empty
                  </li>
                ) : (
                  column.leads.map((lead) => (
                    <li
                      key={lead.id}
                      className={cn(
                        "glass-soft cursor-pointer rounded-xl border border-white/6 p-3 transition-all",
                        "hover:-translate-y-0.5 hover:border-white/20",
                      )}
                    >
                      <div className="text-xs font-semibold text-zinc-100">{lead.companyName}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">{lead.contactPerson}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-zinc-200">
                          {formatIDRCompact(lead.dealValue)}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                          style={{
                            background: `${accent}22`,
                            color: accent,
                          }}
                        >
                          {lead.probability}%
                        </span>
                      </div>
                      <div className="mt-1.5 text-[10px] text-zinc-500">
                        Follow-up · {lead.followUpDate}
                      </div>
                    </li>
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
