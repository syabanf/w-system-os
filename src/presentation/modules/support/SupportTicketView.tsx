"use client";

import { useEffect, useState } from "react";
import { AlarmClock, AlertOctagon, GitPullRequest, LifeBuoy } from "lucide-react";
import { createSupportService } from "@/application/factories/createSupportService";
import type { TicketSLAOverview } from "@/application/use-cases/support/GetTicketSLAOverview";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { TicketQueue } from "./TicketQueue";
import { TicketDetailView } from "./TicketDetailView";
import { SLARiskPanel } from "./SLARiskPanel";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";

export function SupportTicketView() {
  const [data, setData] = useState<TicketSLAOverview | null>(null);
  const [drillId, setDrillId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const overview = await createSupportService().getOverview();
      if (!cancelled) setData(overview);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <SkeletonLoadingView />;

  const drillTicket = drillId ? data.tickets.find((t) => t.id === drillId) ?? null : null;
  const crumbs: Crumb[] = drillTicket
    ? [
        { id: "queue", label: "Queue" },
        { id: drillTicket.id, label: drillTicket.title, sublabel: drillTicket.code },
      ]
    : [{ id: "queue", label: "Queue" }];

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
        <ManageMasterDataButton moduleId="support" />
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
              value={String(data.openCount)}
              trend={data.openCount > 5 ? "down" : "flat"}
            />
            <MetricCard
              icon={AlertOctagon}
              label="SLA Breached"
              value={String(data.breachedCount)}
              accent="#EF4444"
              trend={data.breachedCount > 0 ? "down" : "flat"}
            />
            <MetricCard
              icon={AlarmClock}
              label="Avg Resolution"
              value={`${data.averageResolutionHours.toFixed(1)}h`}
              trend="up"
              accent="#3B82F6"
            />
            <MetricCard
              icon={GitPullRequest}
              label="Change Requests"
              value={String(data.changeRequestCount)}
              accent="#A855F7"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr,320px]">
            <div className="glass rounded-[20px] p-5">
              <SectionHeader
                eyebrow="Queue"
                title={`Tickets (${data.tickets.length})`}
                description="Sorted by SLA urgency. Click a row to drill into ticket detail."
              />
              <TicketQueue rows={data.tickets} onRowClick={(t) => setDrillId(t.id)} />
            </div>
            <div className="glass rounded-[20px] p-5">
              <SectionHeader eyebrow="SLA radar" title="Risk surface" />
              <SLARiskPanel tickets={data.tickets} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
