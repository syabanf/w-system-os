"use client";

import { useEffect, useMemo, useState } from "react";
import { AlarmClock, AlertOctagon, GitPullRequest, LifeBuoy, Pencil, Plus, Trash2 } from "lucide-react";
import { createSupportService } from "@/application/factories/createSupportService";
import type {
  EnrichedTicket,
  TicketSLAOverview,
} from "@/application/use-cases/support/GetTicketSLAOverview";
import type { Ticket } from "@/domain/entities/Ticket";
import { hoursUntilSLA, isSLAAtRisk, isSLABreached } from "@/domain/rules/sla.rules";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useTicketsStore } from "@/state/tickets.store";
import { useToast } from "@/state/toast.store";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { TicketQueue } from "./TicketQueue";
import { TicketDetailView } from "./TicketDetailView";
import { SLARiskPanel } from "./SLARiskPanel";
import { TicketFormDialog } from "./TicketFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";

const NOW = new Date("2026-05-18T09:00:00Z");

function enrich(ticket: Ticket): EnrichedTicket {
  const client = mockClients.find((c) => c.id === ticket.clientId);
  const project = mockProjects.find((p) => p.id === ticket.projectId);
  const assignee = mockTeam.find((m) => m.id === ticket.assignedToId);
  return {
    ...ticket,
    clientName: client?.name ?? "Unknown",
    projectName: project?.name ?? "Unknown",
    assigneeName: assignee?.name ?? "Unassigned",
    hoursUntilSLA: hoursUntilSLA(ticket, NOW),
    isAtRisk: isSLAAtRisk(ticket, NOW),
    isBreached: isSLABreached(ticket, NOW),
  };
}

export function SupportTicketView() {
  const [baseline, setBaseline] = useState<TicketSLAOverview | null>(null);
  const [drillId, setDrillId] = useState<string | null>(null);

  const storeTickets = useTicketsStore((s) => s.items);
  const hydrate = useTicketsStore((s) => s.hydrate);
  const addTicket = useTicketsStore((s) => s.add);
  const updateTicket = useTicketsStore((s) => s.update);
  const removeTicket = useTicketsStore((s) => s.remove);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Ticket | null>(null);

  useEffect(() => {
    hydrate();
    let cancelled = false;
    (async () => {
      const overview = await createSupportService().getOverview();
      if (!cancelled) setBaseline(overview);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const enriched: EnrichedTicket[] = useMemo(
    () => storeTickets.map(enrich),
    [storeTickets],
  );

  // Live aggregates derived from the store; baseline only contributes
  // averageResolutionHours (a historical metric that doesn't shift on edit).
  const openCount = enriched.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length;
  const breachedCount = enriched.filter((t) => t.isBreached).length;
  const changeRequestCount = enriched.filter((t) => t.isChangeRequest).length;
  const averageResolutionHours = baseline?.averageResolutionHours ?? 0;

  if (!baseline) return <SkeletonLoadingView />;

  const drillTicket = drillId ? enriched.find((t) => t.id === drillId) ?? null : null;
  const crumbs: Crumb[] = drillTicket
    ? [
        { id: "queue", label: "Queue" },
        { id: drillTicket.id, label: drillTicket.title, sublabel: drillTicket.code },
      ]
    : [{ id: "queue", label: "Queue" }];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: Ticket) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Delivery · Support
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {drillTicket ? "Ticket drill-down" : "Support & change requests"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {drillTicket
              ? "Top-down: queue → ticket → SLA + routing + timeline."
              : "Post-go-live incident queue, SLA pressure, and scope-change impact."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {drillTicket ? (
            <>
              <button
                type="button"
                onClick={() => openEdit(drillTicket)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(drillTicket)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          ) : null}
          <ManageMasterDataButton moduleId="support" />
        </div>
      </header>

      {drillTicket ? (
        <>
          <DrillBreadcrumb
            crumbs={crumbs}
            onJump={(i) => i === 0 && setDrillId(null)}
            ariaLabel="Ticket drill-down"
          />
          <TicketDetailView ticket={drillTicket} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              emphasis
              icon={LifeBuoy}
              label="Open Tickets"
              value={String(openCount)}
              trend={openCount > 5 ? "down" : "flat"}
            />
            <MetricCard
              icon={AlertOctagon}
              label="SLA Breached"
              value={String(breachedCount)}
              accent="#EF4444"
              trend={breachedCount > 0 ? "down" : "flat"}
            />
            <MetricCard
              icon={AlarmClock}
              label="Avg Resolution"
              value={`${averageResolutionHours.toFixed(1)}h`}
              trend="up"
              accent="#3B82F6"
            />
            <MetricCard
              icon={GitPullRequest}
              label="Change Requests"
              value={String(changeRequestCount)}
              accent="#A855F7"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr,320px]">
            <div className="glass rounded-[20px] p-5">
              <SectionHeader
                eyebrow="Queue"
                title={`Tickets (${enriched.length})`}
                description="Sorted by SLA urgency. Click a row to drill into ticket detail."
                action={
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
                  >
                    <Plus className="h-3 w-3" />
                    New ticket
                  </button>
                }
              />
              <TicketQueue rows={enriched} onRowClick={(t) => setDrillId(t.id)} />
            </div>
            <div className="glass rounded-[20px] p-5">
              <SectionHeader eyebrow="SLA radar" title="Risk surface" />
              <SLARiskPanel tickets={enriched} />
            </div>
          </div>
        </>
      )}

      <TicketFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateTicket(editingId, draft);
            toast.success("Ticket updated", draft.title);
          } else {
            addTicket(draft);
            toast.success("Ticket created", draft.title);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Close & remove ticket?"
        description={
          confirmDelete
            ? `${confirmDelete.code} · ${confirmDelete.title} will be removed from the queue. SLA history stays for reporting.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const code = confirmDelete.code;
          removeTicket(confirmDelete.id);
          setConfirmDelete(null);
          setDrillId(null);
          toast.info("Ticket removed", `${code} has been archived.`);
        }}
      />
    </div>
  );
}
