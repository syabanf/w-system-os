"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Megaphone, Target, TrendingUp } from "lucide-react";
import { createSalesService } from "@/application/factories/createSalesService";
import type { PipelineStage } from "@/application/use-cases/crm/GetSalesPipeline";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { LeadPipelineBoard } from "./LeadPipelineBoard";
import { SalesFunnelChart } from "./SalesFunnelChart";
import { LeadTable } from "./LeadTable";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

export function CRMView({ compact = false }: { compact?: boolean } = {}) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [conversion, setConversion] = useState({ conversionRate: 0, wonCount: 0, lostCount: 0, pipelineCount: 0 });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const service = createSalesService();
      const [p, c] = await Promise.all([service.getPipeline(), service.getConversion()]);
      if (!cancelled) {
        setStages(p);
        setConversion(c);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allLeads = useMemo(() => stages.flatMap((s) => s.leads), [stages]);
  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allLeads;
    return allLeads.filter(
      (l) =>
        l.companyName.toLowerCase().includes(q) ||
        l.contactPerson.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q),
    );
  }, [allLeads, query]);

  const totalPipeline = stages
    .filter((s) => s.stage !== "Won" && s.stage !== "Lost")
    .reduce((sum, s) => sum + s.totalValue, 0);

  const weightedPipeline = stages
    .filter((s) => s.stage !== "Won" && s.stage !== "Lost")
    .reduce((sum, s) => sum + s.weightedValue, 0);

  const upcomingFollowUps = allLeads
    .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
    .sort((a, b) => (a.followUpDate < b.followUpDate ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      {!compact ? (
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Growth · CRM & Sales
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">Sales pipeline</h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            End-to-end visibility into qualified leads, weighted forecast, and revenue commitment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Filter leads by company, contact, source…"
            className="w-full sm:w-auto md:w-72 lg:w-80"
          />
          <ManageMasterDataButton moduleId="leads" />
        </div>
      </header>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Megaphone}
          label="Pipeline Value"
          value={formatIDRCompact(totalPipeline)}
          delta={`${formatIDRCompact(weightedPipeline)} weighted`}
          trend="up"
        />
        <MetricCard
          icon={TrendingUp}
          label="Win Rate"
          value={formatPercent(conversion.conversionRate, 0)}
          delta={`${conversion.wonCount} won / ${conversion.lostCount} lost`}
          trend="up"
          accent="#22C55E"
        />
        <MetricCard
          icon={Target}
          label="Active Deals"
          value={String(conversion.pipelineCount)}
          delta={`${stages.find((s) => s.stage === "Negotiation")?.leads.length ?? 0} in negotiation`}
          accent="#F59E0B"
        />
        <MetricCard
          icon={Briefcase}
          label="Avg Deal Size"
          value={
            allLeads.length
              ? formatIDRCompact(allLeads.reduce((s, l) => s + l.dealValue, 0) / allLeads.length)
              : "—"
          }
          accent="#71717A"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Pipeline"
          title="Kanban view"
          description="Drag-free overview — click any card to deep-dive (mock)."
        />
        <LeadPipelineBoard stages={stages} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Sales funnel — weighted value"
          description="Probability-weighted forecast per stage."
          height={260}
        >
          <SalesFunnelChart stages={stages} />
        </ChartCard>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Cadence" title="Upcoming follow-ups" />
          <ul className="space-y-2">
            {upcomingFollowUps.map((l) => (
              <li
                key={l.id}
                className="glass-soft flex items-center justify-between rounded-xl border border-white/6 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-zinc-100">{l.companyName}</div>
                  <div className="text-[10px] text-zinc-400">{l.contactPerson} · {l.stage}</div>
                </div>
                <span className="font-mono text-[11px] text-zinc-300">{l.followUpDate}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Records" title={`All leads (${filteredLeads.length})`} />
        <LeadTable leads={filteredLeads} />
      </div>
    </div>
  );
}
