"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Receipt, TrendingUp, AlertTriangle } from "lucide-react";
import { createFinanceService } from "@/application/factories/createFinanceService";
import type { FinanceOverviewDTO } from "@/application/dtos/FinanceDTO";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { InvoiceTable } from "./InvoiceTable";
import { CashflowChart } from "./CashflowChart";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GeneralLedgerPanel } from "./GeneralLedgerPanel";
import { TerminSchedulePanel } from "./TerminSchedulePanel";
import { formatIDRCompact } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

type Tab = "billing" | "gl" | "termin";

export function FinanceBillingView() {
  const [data, setData] = useState<FinanceOverviewDTO | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("billing");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const overview = await createFinanceService().getOverview();
      if (!cancelled) setData(overview);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const invoices = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.invoices;
    return data.invoices.filter(
      (i) =>
        i.number.toLowerCase().includes(q) ||
        i.clientName.toLowerCase().includes(q) ||
        i.projectName.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q),
    );
  }, [data, query]);

  if (!data) return <SkeletonLoadingView />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Finance · Accounting
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Books & receivables
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Monthly revenue and AR on the Billing tab; installment monitoring on the Termin
            Schedule tab; full double-entry GL with chart of accounts and journal entries on the
            General Ledger tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "billing" ? (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search invoices, client, project…"
              className="w-full sm:w-auto md:w-72"
            />
          ) : null}
          <TabSwitch tab={tab} onChange={setTab} />
          <ManageMasterDataButton moduleId="finance" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={TrendingUp}
          label="Monthly Revenue"
          value={formatIDRCompact(data.monthlyRevenue)}
          delta={`forecast ${formatIDRCompact(data.forecastNextMonth)}`}
          trend="up"
        />
        <MetricCard
          icon={Receipt}
          label="Outstanding"
          value={formatIDRCompact(data.outstandingTotal)}
          accent="#F59E0B"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Overdue"
          value={formatIDRCompact(data.overdueTotal)}
          accent="#EF4444"
        />
        <MetricCard
          icon={Banknote}
          label="Paid This Month"
          value={formatIDRCompact(data.paidThisMonth)}
          trend="up"
          accent="#22C55E"
        />
      </div>

      {tab === "billing" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              title="Cashflow overview"
              description="Revenue vs. cost over the last 6 months."
              height={240}
            >
              <CashflowChart data={data.trend} />
            </ChartCard>
            <div className="glass rounded-[20px] p-5">
              <SectionHeader
                eyebrow="Profitability"
                title="Margin by project"
                description="Sorted by gross margin (planned vs. actual)."
              />
              <ProfitabilityPanel rows={data.profitabilityByProject} />
            </div>
          </div>

          <div className="glass rounded-[20px] p-5">
            <SectionHeader eyebrow="Receivables" title={`Invoices (${invoices.length})`} />
            <InvoiceTable rows={invoices} />
          </div>
        </>
      ) : tab === "gl" ? (
        <GeneralLedgerPanel />
      ) : (
        <TerminSchedulePanel />
      )}
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: "billing", label: "Billing" },
    { id: "termin", label: "Termin Schedule" },
    { id: "gl", label: "General Ledger" },
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
