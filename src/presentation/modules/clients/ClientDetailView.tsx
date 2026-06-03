"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  HeartPulse,
  LifeBuoy,
  Mail,
  MapPin,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { ClientPortfolioItem } from "@/application/use-cases/clients/GetClientPortfolio";
import type { Invoice } from "@/domain/entities/Invoice";
import type { Ticket } from "@/domain/entities/Ticket";
import { useInvoicesStore } from "@/state/invoices.store";
import { useTicketsStore } from "@/state/tickets.store";
import { useProjectsStore } from "@/state/projects.store";
import { createProjectService } from "@/application/factories/createProjectService";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { Avatar } from "@/presentation/shared/Avatar";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { ProjectMilestoneTracker } from "@/presentation/modules/projects/ProjectMilestoneTracker";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";

const HEALTH_TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  excellent: "success",
  stable: "info",
  "at-risk": "warning",
  "churn-risk": "danger",
};

const INVOICE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

const TICKET_SEVERITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

type Tab = "engagements" | "invoices" | "tickets" | "activity";

export function ClientDetailView({ client }: { client: ClientPortfolioItem }) {
  const [projects, setProjects] = useState<ProjectOverviewDTO[]>([]);
  const [tab, setTab] = useState<Tab>("engagements");

  // Source live data from the stores so this view reflects edits made anywhere
  // else in the app (single source of truth), not a frozen mock snapshot.
  const allInvoices = useInvoicesStore((s) => s.items);
  const hydrateInvoices = useInvoicesStore((s) => s.hydrate);
  const allTickets = useTicketsStore((s) => s.items);
  const hydrateTickets = useTicketsStore((s) => s.hydrate);
  const allProjects = useProjectsStore((s) => s.items);
  const hydrateProjects = useProjectsStore((s) => s.hydrate);

  useEffect(() => {
    hydrateInvoices();
    hydrateTickets();
    hydrateProjects();
  }, [hydrateInvoices, hydrateTickets, hydrateProjects]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await createProjectService().getOverview();
      if (!cancelled) setProjects(all.filter((p) => p.clientId === client.id));
    })();
    return () => {
      cancelled = true;
    };
  }, [client.id]);

  const invoices = useMemo(
    () => allInvoices.filter((i) => i.clientId === client.id),
    [allInvoices, client.id],
  );
  const tickets = useMemo(
    () => allTickets.filter((t) => t.clientId === client.id),
    [allTickets, client.id],
  );
  // The milestone tracker needs a project anchor. Pick the first project for
  // this client from the projects store. Falls back to undefined → empty-state.
  const firstProjectId = useMemo(
    () => allProjects.find((p) => p.clientId === client.id)?.id,
    [allProjects, client.id],
  );

  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const openTickets = tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed").length;

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={client.name} color={client.logoColor} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={HEALTH_TONE[client.health]} dot>
                {client.health}
              </StatusBadge>
              {client.retainerActive ? (
                <StatusBadge tone="wit">Active retainer</StatusBadge>
              ) : null}
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">{client.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {client.industry}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {client.region}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Renews{" "}
                {new Date(client.renewalDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 px-3 py-2">
            <Avatar name={client.primaryContact} color="#3B82F6" size="sm" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-zinc-100">
                {client.primaryContact}
              </div>
              <div className="flex items-center gap-1 truncate text-[10px] text-zinc-400">
                <Mail className="h-3 w-3" />
                {client.contactEmail}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Wallet}
          label="Contract LTV"
          value={formatIDRCompact(client.contractValue)}
          delta={`${projects.length} engagements`}
          trend="up"
        />
        <MetricCard
          icon={HeartPulse}
          label="Satisfaction"
          value={formatPercent(client.satisfactionScore, 0)}
          trend={client.satisfactionScore > 80 ? "up" : "down"}
          accent="#22C55E"
        />
        <MetricCard
          icon={Receipt}
          label="Outstanding"
          value={formatIDRCompact(outstanding)}
          delta={overdueCount > 0 ? `${overdueCount} overdue` : "current"}
          trend={overdueCount > 0 ? "down" : "flat"}
          accent={overdueCount > 0 ? "#EF4444" : "#71717A"}
        />
        <MetricCard
          icon={LifeBuoy}
          label="Open tickets"
          value={String(openTickets)}
          delta={`${tickets.length} all time`}
          trend={openTickets > 0 ? "down" : "flat"}
          accent="#F59E0B"
        />
      </div>

      <section>
        <SectionHeader
          eyebrow="Workflow"
          title="Project milestones"
          description="Per-engagement workflow + payment + dev tracker."
        />
        {client.activeProjects > 0 && firstProjectId ? (
          <ProjectMilestoneTracker projectId={firstProjectId} />
        ) : (
          <div className="glass rounded-[20px] border border-dashed border-white/10 p-8 text-center">
            <div className="text-sm font-semibold text-zinc-100">
              No project linked yet
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Link a project to this client from the Projects module to start
              tracking workflow, payment, and development milestones.
            </p>
          </div>
        )}
      </section>

      <div className="glass rounded-[20px] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {tab === "engagements" && `${projects.length} engagements`}
            {tab === "invoices" && `${invoices.length} invoices`}
            {tab === "tickets" && `${tickets.length} tickets`}
            {tab === "activity" && "snapshot"}
          </span>
        </div>

        {tab === "engagements" ? (
          <EngagementsList projects={projects} />
        ) : tab === "invoices" ? (
          <InvoicesList invoices={invoices} />
        ) : tab === "tickets" ? (
          <TicketsList tickets={tickets} />
        ) : (
          <ActivitySnapshot client={client} invoices={invoices} tickets={tickets} />
        )}
      </div>
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: "engagements", label: "Engagements" },
    { id: "invoices", label: "Invoices" },
    { id: "tickets", label: "Tickets" },
    { id: "activity", label: "Activity" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EngagementsList({ projects }: { projects: ProjectOverviewDTO[] }) {
  if (projects.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No active engagements.
      </div>
    );
  return (
    <ul className="space-y-2">
      {projects.map((p) => (
        <li
          key={p.id}
          className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 p-3"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-zinc-300">
            <Briefcase className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500">{p.code}</span>
              <StatusBadge
                tone={
                  p.health === "red"
                    ? "danger"
                    : p.health === "amber"
                      ? "warning"
                      : "success"
                }
                dot
              >
                {p.status}
              </StatusBadge>
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold text-zinc-100">{p.name}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative h-1 w-32 overflow-hidden rounded-full bg-white/8">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-zinc-200"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-zinc-300">{p.progress}%</span>
              <span className="text-[10px] text-zinc-500">
                {formatIDRCompact(p.budget)} · {formatPercent(p.grossMargin, 0)} margin
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No invoices for this client.
      </div>
    );
  return (
    <ul className="space-y-1.5">
      {invoices.map((inv) => (
        <li
          key={inv.id}
          className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
        >
          <span className="col-span-3 font-mono text-[11px] text-zinc-200">{inv.number}</span>
          <span className="col-span-3 text-[11px] text-zinc-400">
            {inv.issueDate} → {inv.dueDate}
          </span>
          <span className="col-span-3 text-right font-mono text-[11px] text-zinc-100">
            {formatIDRCompact(inv.amount)}
          </span>
          <span className="col-span-2 text-right font-mono text-[10px] text-zinc-400">
            {formatIDRCompact(inv.paidAmount)} paid
          </span>
          <span className="col-span-1 text-right">
            <StatusBadge tone={INVOICE_TONE[inv.status]}>{inv.status}</StatusBadge>
          </span>
        </li>
      ))}
    </ul>
  );
}

function TicketsList({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No tickets for this client.
      </div>
    );
  return (
    <ul className="space-y-1.5">
      {tickets.map((t) => (
        <li
          key={t.id}
          className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
        >
          <span className="col-span-2 font-mono text-[10px] text-zinc-400">{t.code}</span>
          <span className="col-span-5 truncate text-[12px] text-zinc-100">
            {t.title}
            {t.isChangeRequest ? (
              <span className="ml-1.5 rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                CR
              </span>
            ) : null}
          </span>
          <span className="col-span-2">
            <StatusBadge tone={TICKET_SEVERITY_TONE[t.severity]} dot>
              {t.severity}
            </StatusBadge>
          </span>
          <span className="col-span-3 text-right text-[11px] text-zinc-300">{t.status}</span>
        </li>
      ))}
    </ul>
  );
}

function ActivitySnapshot({
  client,
  invoices,
  tickets,
}: {
  client: ClientPortfolioItem;
  invoices: Invoice[];
  tickets: Ticket[];
}) {
  const lastInvoice = invoices.slice().sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))[0];
  const lastTicket = tickets
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

  return (
    <ul className="space-y-2">
      <ActivityRow
        icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
        title="Account onboarded"
        detail={`Joined ${new Date(client.joinedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
      />
      {lastInvoice ? (
        <ActivityRow
          icon={<Receipt className="h-4 w-4 text-blue-300" />}
          title={`Invoice ${lastInvoice.number}`}
          detail={`${formatIDRCompact(lastInvoice.amount)} · issued ${lastInvoice.issueDate} · ${lastInvoice.status}`}
        />
      ) : null}
      {lastTicket ? (
        <ActivityRow
          icon={<LifeBuoy className="h-4 w-4 text-amber-300" />}
          title={`Ticket ${lastTicket.code}`}
          detail={`${lastTicket.title} · ${lastTicket.status}`}
        />
      ) : null}
      <ActivityRow
        icon={<Calendar className="h-4 w-4 text-zinc-300" />}
        title="Renewal scheduled"
        detail={new Date(client.renewalDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      />
    </ul>
  );
}

function ActivityRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 p-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-zinc-100">{title}</div>
        <div className="truncate text-[11px] text-zinc-400">{detail}</div>
      </div>
    </li>
  );
}
