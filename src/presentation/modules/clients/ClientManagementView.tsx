"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartPulse, ShieldAlert, Users2, Wallet } from "lucide-react";
import { createClientService } from "@/application/factories/createClientService";
import type { ClientPortfolioItem } from "@/application/use-cases/clients/GetClientPortfolio";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { ClientDirectory } from "./ClientDirectory";
import { ClientDetailView } from "./ClientDetailView";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

export function ClientManagementView() {
  const [clients, setClients] = useState<ClientPortfolioItem[]>([]);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await createClientService().getPortfolio();
      if (!cancelled) setClients(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
            />
            <ClientDirectory clients={filtered} selectedId={null} onSelect={setDrillId} />
          </div>
        </>
      )}
    </div>
  );
}
