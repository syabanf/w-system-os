"use client";

import { useEffect, useState } from "react";
import { Calendar, Mail, Percent, Target, User, Wallet, X } from "lucide-react";
import type { Lead, LeadStage } from "@/domain/entities/Lead";
import type { PipelineStage } from "@/application/use-cases/crm/GetSalesPipeline";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useLeadsStore } from "@/state/leads.store";
import { useToast } from "@/state/toast.store";
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

/** Recompute a column's aggregate values from its current leads. */
function withTotals(stage: LeadStage, leads: Lead[]): PipelineStage {
  const totalValue = leads.reduce((sum, l) => sum + l.dealValue, 0);
  const weightedValue = leads.reduce(
    (sum, l) => sum + l.dealValue * (l.probability / 100),
    0,
  );
  return { stage, leads, totalValue, weightedValue };
}

export function LeadPipelineBoard({ stages }: { stages: PipelineStage[] }) {
  const [selected, setSelected] = useState<Lead | null>(null);
  // Local board state seeded from the prop. The prop is derived from a service
  // (not the store), so it won't update after a move — we mutate `board` locally
  // and persist intent to the store separately.
  const [board, setBoard] = useState<PipelineStage[]>(stages);
  // Which column is currently a valid drop target (for the hover highlight).
  const [dropTarget, setDropTarget] = useState<LeadStage | null>(null);

  const updateLead = useLeadsStore((s) => s.update);
  const toast = useToast();

  // Re-sync if the upstream prop changes.
  useEffect(() => setBoard(stages), [stages]);

  const moveLead = (leadId: string, toStage: LeadStage) => {
    setBoard((prev) => {
      const fromColumn = prev.find((c) => c.leads.some((l) => l.id === leadId));
      if (!fromColumn) return prev;
      const lead = fromColumn.leads.find((l) => l.id === leadId)!;
      if (fromColumn.stage === toStage) return prev; // no-op drop

      const moved: Lead = { ...lead, stage: toStage };
      const next = prev.map((column) => {
        if (column.stage === fromColumn.stage) {
          return withTotals(
            column.stage,
            column.leads.filter((l) => l.id !== leadId),
          );
        }
        if (column.stage === toStage) {
          return withTotals(column.stage, [...column.leads, moved]);
        }
        return column;
      });

      // Persist intent to the store + notify.
      updateLead(leadId, { stage: toStage });
      toast.success("Lead moved", `${lead.companyName} → ${toStage}`);

      return next;
    });
  };

  return (
    <div className="glass-scroll -mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3 px-1">
        {board.map((column) => {
          const accent = STAGE_ACCENT[column.stage] ?? "#FAFAF9";
          const isDropTarget = dropTarget === column.stage;
          return (
            <div
              key={column.stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dropTarget !== column.stage) setDropTarget(column.stage);
              }}
              onDragLeave={(e) => {
                // Only clear when leaving the column itself, not its children.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setDropTarget((cur) => (cur === column.stage ? null : cur));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const leadId = e.dataTransfer.getData("text/lead");
                if (leadId) moveLead(leadId, column.stage);
              }}
              className={cn(
                "w-[260px] shrink-0 rounded-2xl border p-3 transition-colors",
                isDropTarget
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-white/8 bg-white/[0.025]",
              )}
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
                  <li
                    className={cn(
                      "rounded-xl border border-dashed p-3 text-center text-[10px] transition-colors",
                      isDropTarget
                        ? "border-white/30 text-zinc-300"
                        : "border-white/8 text-zinc-500",
                    )}
                  >
                    {isDropTarget ? "Drop here" : "Empty"}
                  </li>
                ) : (
                  column.leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      accent={accent}
                      onOpen={() => setSelected(lead)}
                    />
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

/** A single draggable kanban card. A plain click (no drag) opens the quick view. */
function LeadCard({
  lead,
  accent,
  onOpen,
}: {
  lead: Lead;
  accent: string;
  onOpen: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <li>
      <button
        type="button"
        draggable
        onClick={onOpen}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/lead", lead.id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={cn(
          "glass-soft block w-full cursor-pointer rounded-xl border border-white/6 p-3 text-left transition-all",
          "hover:-translate-y-0.5 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          dragging && "opacity-40",
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
