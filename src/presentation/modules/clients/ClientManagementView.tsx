"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartPulse, Pencil, Plus, ShieldAlert, Trash2, Users2, Wallet } from "lucide-react";
import { createClientService } from "@/application/factories/createClientService";
import type { ClientPortfolioItem } from "@/application/use-cases/clients/GetClientPortfolio";
import type { Client } from "@/domain/entities/Client";
import { useClientsStore } from "@/state/clients.store";
import { useToast } from "@/state/toast.store";
import { useHotkey } from "@/hooks/useHotkey";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { ClientDirectory } from "./ClientDirectory";
import { ClientDetailView } from "./ClientDetailView";
import { ClientFormDialog } from "./ClientFormDialog";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

export function ClientManagementView() {
  const [drillId, setDrillId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [projectsByClient, setProjectsByClient] = useState<Record<string, { count: number; budget: number }>>({});

  const items = useClientsStore((s) => s.items);
  const hydrate = useClientsStore((s) => s.hydrate);
  const addClient = useClientsStore((s) => s.add);
  const updateClient = useClientsStore((s) => s.update);
  const removeClient = useClientsStore((s) => s.remove);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);

  useEffect(() => {
    hydrate();
    // Fetch the project-aggregation slice once — it never changes during a session
    // since project data is read-only here. Project counts/budgets are merged in
    // client-side from this snapshot.
    let cancelled = false;
    (async () => {
      const data = await createClientService().getPortfolio();
      if (cancelled) return;
      const map: Record<string, { count: number; budget: number }> = {};
      for (const item of data) {
        map[item.id] = { count: item.projectCount, budget: item.totalProjectBudget };
      }
      setProjectsByClient(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const clients: ClientPortfolioItem[] = useMemo(() => {
    return items.map((c) => ({
      ...c,
      projectCount: projectsByClient[c.id]?.count ?? c.activeProjects,
      totalProjectBudget: projectsByClient[c.id]?.budget ?? 0,
    }));
  }, [items, projectsByClient]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q),
    );
  }, [clients, query]);

  const drillClient = drillId ? clients.find((c) => c.id === drillId) ?? null : null;

  const totalLTV = clients.reduce((s, c) => s + c.contractValue, 0);
  const avgCsat = clients.length
    ? clients.reduce((s, c) => s + c.satisfactionScore, 0) / clients.length
    : 0;
  const retainerActive = clients.filter((c) => c.retainerActive).length;
  const churnRisk = clients.filter((c) => c.health === "churn-risk" || c.health === "at-risk").length;

  const crumbs: Crumb[] = drillClient
    ? [
        { id: "portfolio", label: "Portfolio" },
        { id: drillClient.id, label: drillClient.name },
      ]
    : [{ id: "portfolio", label: "Portfolio" }];

  const jumpToLevel = (idx: number) => {
    if (idx === 0) setDrillId(null);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setFormOpen(true);
  };

  // ⌘N / Ctrl-N → quick "add client" — matches every other CRUD module.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    openCreate();
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Growth · Clients
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {drillClient ? "Client drill-down" : "Client portfolio"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {drillClient
              ? "Top-down: portfolio → account → engagements / invoices / tickets / activity."
              : "Accounts, relationship health, satisfaction, and renewal pipeline."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!drillClient ? (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search clients, industry, region…"
              className="w-full sm:w-auto md:w-72 lg:w-80"
            />
          ) : null}
          {drillClient ? (
            <>
              <button
                type="button"
                onClick={() => openEdit(drillClient)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(drillClient)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          ) : null}
          <ManageMasterDataButton moduleId="clients" />
        </div>
      </header>

      {drillClient ? (
        <>
          <DrillBreadcrumb
            crumbs={crumbs}
            onJump={jumpToLevel}
            ariaLabel="Client drill-down"
          />
          <ClientDetailView client={drillClient} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              emphasis
              icon={Wallet}
              label="Total LTV"
              value={formatIDRCompact(totalLTV)}
              delta={`${clients.length} accounts`}
              trend="up"
            />
            <MetricCard
              icon={HeartPulse}
              label="Avg Satisfaction"
              value={formatPercent(avgCsat, 0)}
              trend={avgCsat > 80 ? "up" : "down"}
              accent="#22C55E"
            />
            <MetricCard
              icon={Users2}
              label="Active Retainers"
              value={String(retainerActive)}
              delta={`${formatPercent((retainerActive / Math.max(1, clients.length)) * 100, 0)} of portfolio`}
              accent="#3B82F6"
            />
            <MetricCard
              icon={ShieldAlert}
              label="At-risk Accounts"
              value={String(churnRisk)}
              trend={churnRisk > 0 ? "down" : "flat"}
              accent="#EF4444"
            />
          </div>

          <div className="glass rounded-[20px] p-5">
            <SectionHeader
              eyebrow="Directory"
              title={`Accounts (${filtered.length})`}
              description="Click any account to drill into engagements, invoices, tickets and activity."
              action={
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
                >
                  <Plus className="h-3 w-3" />
                  Add client
                </button>
              }
            />
            <ClientDirectory clients={filtered} selectedId={null} onSelect={setDrillId} />
          </div>
        </>
      )}

      <ClientFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateClient(editingId, draft);
            toast.success("Client updated", draft.name);
          } else {
            addClient(draft);
            toast.success("Client added", `${draft.name} joined the portfolio`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Remove client?"
        description={
          confirmDelete
            ? `${confirmDelete.name} will be removed from the portfolio. Linked projects and invoices stay orphaned for now.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = confirmDelete.name;
          removeClient(confirmDelete.id);
          setConfirmDelete(null);
          setDrillId(null);
          toast.info("Client removed", `${name} has been archived.`);
        }}
      />
    </div>
  );
}
