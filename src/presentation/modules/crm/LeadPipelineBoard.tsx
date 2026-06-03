"use client";

import { useEffect, useState } from "react";
import { Calendar, Mail, Percent, Target, User, Wallet, X } from "lucide-react";
import type { Lead } from "@/domain/entities/Lead";
import type { PipelineStage } from "@/application/use-cases/crm/GetSalesPipeline";
import { mockTeam } from "@/infrastructure/data/team.mock";
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
  const [selected, setSelected] = useState<Lead | null>(null);

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
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(lead)}
                        className={cn(
                          "glass-soft block w-full cursor-pointer rounded-xl border border-white/6 p-3 text-left transition-all",
                          "hover:-translate-y-0.5 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
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
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <LeadQuickView lead={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/** Read-only deep-dive for a single lead — opened by clicking a kanban card. */
function LeadQuickView({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  if (!lead) return null;

  const accent = STAGE_ACCENT[lead.stage] ?? "#FAFAF9";
  const owner = mockTeam.find((m) => m.id === lead.ownerId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[10vh] backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: `${accent}22`, color: accent }}
              >
                {lead.stage}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {lead.source}
              </span>
            </div>
            <h3 className="mt-1.5 truncate text-base font-semibold text-zinc-50">
              {lead.companyName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
          <QuickField icon={User} label="Contact">
            {lead.contactPerson}
          </QuickField>
          <QuickField icon={Mail} label="Email">
            <a href={`mailto:${lead.contactEmail}`} className="text-sky-300 hover:underline">
              {lead.contactEmail}
            </a>
          </QuickField>
          <QuickField icon={Wallet} label="Deal value">
            {formatIDRCompact(lead.dealValue)}
          </QuickField>
          <QuickField icon={Percent} label="Probability">
            {lead.probability}%
          </QuickField>
          <QuickField icon={Calendar} label="Follow-up">
            {lead.followUpDate}
          </QuickField>
          <QuickField icon={Target} label="Owner">
            {owner?.name ?? "Unassigned"}
          </QuickField>
        </div>

        {lead.notes ? (
          <div className="border-t border-white/8 px-5 py-4">
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Notes
            </div>
            <p className="whitespace-pre-line text-[12px] text-zinc-200">{lead.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QuickField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-0.5 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <div className="truncate text-[12px] text-zinc-100">{children}</div>
    </div>
  );
}
