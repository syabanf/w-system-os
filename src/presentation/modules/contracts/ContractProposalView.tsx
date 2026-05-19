"use client";

import { useEffect, useState } from "react";
import { CalendarClock, FileSignature, ScrollText, ShieldCheck } from "lucide-react";
import { createContractService } from "@/application/factories/createContractService";
import type { ContractSummary } from "@/application/use-cases/contracts/GetContractSummary";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ContractStatusPanel } from "./ContractStatusPanel";
import { ProposalTable } from "./ProposalTable";
import { formatIDRCompact } from "@/lib/currency";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

export function ContractProposalView({ compact = false }: { compact?: boolean } = {}) {
  const [data, setData] = useState<ContractSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const summary = await createContractService().getSummary();
      if (!cancelled) setData(summary);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <SkeletonLoadingView />;

  const active = data.contracts.filter((c) => c.status === "active").length;
  const expiring = data.contracts.filter((c) => c.status === "expiring").length;
  const pending = data.proposals.filter((p) => p.status === "in-review" || p.status === "sent").length;

  return (
    <div className="space-y-5">
      {!compact ? (
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Commercial · Contracts
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">Contracts & proposals</h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Active commitments, signature pipeline, and renewals on the horizon.
          </p>
        </div>
        <ManageMasterDataButton moduleId="hr" />
      </header>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={ShieldCheck}
          label="Active Contracts"
          value={String(active)}
          delta={formatIDRCompact(data.totalContractValue)}
          trend="up"
        />
        <MetricCard
          icon={CalendarClock}
          label="Expiring (120d)"
          value={String(expiring)}
          accent="#F59E0B"
        />
        <MetricCard
          icon={FileSignature}
          label="Pending Proposals"
          value={String(pending)}
          delta={formatIDRCompact(data.totalProposalValue)}
          accent="#3B82F6"
        />
        <MetricCard
          icon={ScrollText}
          label="Total Pipeline"
          value={formatIDRCompact(data.totalContractValue + data.totalProposalValue)}
          accent="#22C55E"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Live commitments"
          title={`Contracts (${data.contracts.length})`}
          description="Active SOWs, MSAs, and retainers across the portfolio."
        />
        <ContractStatusPanel contracts={data.contracts} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-[20px] p-5 xl:col-span-2">
          <SectionHeader
            eyebrow="Pipeline"
            title="Proposal log"
            description="Status, approval and signature progress."
          />
          <ProposalTable rows={data.proposals} />
        </div>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Calendar" title="Upcoming renewals" />
          <ul className="space-y-2">
            {data.upcomingRenewals.length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/8 p-4 text-center text-xs text-zinc-400">
                No renewals in the next 120 days.
              </li>
            ) : (
              data.upcomingRenewals.map((c) => (
                <li
                  key={c.id}
                  className="glass-soft flex items-center justify-between rounded-xl border border-white/6 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-100">{c.title}</div>
                    <div className="text-[10px] text-zinc-400">{c.clientName} · {c.endDate}</div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300">
                    {c.daysToExpiry}d
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
