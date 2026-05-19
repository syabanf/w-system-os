"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { mockChartOfAccounts, mockJournalEntries } from "@/infrastructure/data/gl.mock";
import type {
  ChartOfAccount,
  JournalEntry,
  AccountType,
} from "@/domain/entities/GeneralLedger";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";

const TYPE_LABEL: Record<AccountType, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

const TYPE_TONE: Record<AccountType, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  asset: "info",
  liability: "warning",
  equity: "wit",
  revenue: "success",
  expense: "danger",
};

export function GeneralLedgerPanel() {
  const [expandedType, setExpandedType] = useState<AccountType | null>("asset");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(mockJournalEntries[0]);

  const byType = useMemo(() => {
    const groups: Record<AccountType, ChartOfAccount[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };
    mockChartOfAccounts.forEach((a) => groups[a.type].push(a));
    return groups;
  }, []);

  const trialBalance = useMemo(() => {
    const rows: { type: AccountType; debit: number; credit: number }[] = [];
    (Object.keys(byType) as AccountType[]).forEach((type) => {
      const debit = byType[type]
        .filter((a) => !a.isGroup && a.balanceType === "debit")
        .reduce((s, a) => s + Math.max(0, a.balance), 0);
      const credit = byType[type]
        .filter((a) => !a.isGroup && a.balanceType === "credit")
        .reduce((s, a) => s + Math.max(0, a.balance), 0);
      rows.push({ type, debit, credit });
    });
    return rows;
  }, [byType]);

  const totalDebit = trialBalance.reduce((s, r) => s + r.debit, 0);
  const totalCredit = trialBalance.reduce((s, r) => s + r.credit, 0);

  const journalColumns: Column<JournalEntry>[] = [
    {
      key: "no",
      header: "Entry",
      render: (e) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{e.number}</div>
          <div className="text-[10px] text-zinc-400">{e.source}{e.sourceRef ? ` · ${e.sourceRef}` : ""}</div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (e) => <span className="text-[11px] text-zinc-300">{formatDate(e.date)}</span>,
    },
    {
      key: "desc",
      header: "Description",
      render: (e) => <span className="text-[11px] text-zinc-200">{e.description}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (e) => (
        <span className="font-mono text-xs text-zinc-100">{formatIDR(e.totalDebit)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <StatusBadge
          tone={e.status === "posted" ? "success" : e.status === "draft" ? "warning" : "neutral"}
        >
          {e.status}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr,360px]">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Chart of accounts"
            title={`${mockChartOfAccounts.length} accounts`}
            description="Hierarchical CoA with running balances by account type."
          />
          <div className="space-y-2">
            {(Object.keys(byType) as AccountType[]).map((type) => {
              const accounts = byType[type];
              if (accounts.length === 0) return null;
              const expanded = expandedType === type;
              const totalBalance = accounts
                .filter((a) => !a.isGroup)
                .reduce((s, a) => s + Math.abs(a.balance), 0);
              return (
                <div key={type} className="glass-soft rounded-2xl border border-white/8 p-3">
                  <button
                    onClick={() => setExpandedType(expanded ? null : type)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    {expanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <StatusBadge tone={TYPE_TONE[type]}>{TYPE_LABEL[type]}</StatusBadge>
                    <span className="text-[11px] text-zinc-400">{accounts.length} accounts</span>
                    <span className="ml-auto font-mono text-[11px] text-zinc-100">
                      {formatIDRCompact(totalBalance)}
                    </span>
                  </button>
                  {expanded ? (
                    <ul className="mt-2 space-y-0.5">
                      {accounts.map((acc) => (
                        <li
                          key={acc.id}
                          className={cn(
                            "grid grid-cols-12 items-center gap-2 rounded-lg px-2 py-1 text-[11px]",
                            "hover:bg-white/[0.04]",
                            acc.isGroup && "border-l-2 border-white/20",
                          )}
                        >
                          <span
                            className={cn(
                              "col-span-2 font-mono",
                              acc.isGroup ? "font-semibold text-zinc-200" : "text-zinc-400",
                            )}
                          >
                            {acc.code}
                          </span>
                          <span
                            className={cn(
                              "col-span-6 truncate",
                              acc.isGroup ? "font-semibold text-zinc-100" : "text-zinc-200",
                              acc.parentId && "pl-2",
                            )}
                          >
                            {acc.name}
                          </span>
                          <span className="col-span-2 text-[9px] uppercase tracking-wider text-zinc-500">
                            {acc.subType}
                          </span>
                          <span
                            className={cn(
                              "col-span-2 text-right font-mono",
                              acc.balance < 0 ? "text-rose-300" : "text-zinc-100",
                              acc.isGroup && "opacity-0",
                            )}
                          >
                            {acc.isGroup ? "" : formatIDRCompact(acc.balance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-[20px] p-5">
            <SectionHeader eyebrow="Snapshot" title="Trial balance" description="Sum of debits = sum of credits (always)." />
            <ul className="space-y-1.5">
              {trialBalance.map((r) => (
                <li
                  key={r.type}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg px-2 py-1.5 text-[11px]"
                >
                  <span className="col-span-4 text-zinc-200">{TYPE_LABEL[r.type]}</span>
                  <span className="col-span-4 text-right font-mono text-emerald-300">
                    {formatIDRCompact(r.debit)}
                  </span>
                  <span className="col-span-4 text-right font-mono text-sky-300">
                    {formatIDRCompact(r.credit)}
                  </span>
                </li>
              ))}
              <li className="mt-1 grid grid-cols-12 items-center gap-2 rounded-lg border-t border-white/10 px-2 py-2 text-[11px] font-semibold">
                <span className="col-span-4 text-zinc-50">Totals</span>
                <span className="col-span-4 text-right font-mono text-zinc-50">
                  {formatIDRCompact(totalDebit)}
                </span>
                <span className="col-span-4 text-right font-mono text-zinc-50">
                  {formatIDRCompact(totalCredit)}
                </span>
              </li>
            </ul>
            <p
              className={cn(
                "mt-2 text-center text-[10px] uppercase tracking-[0.18em]",
                Math.abs(totalDebit - totalCredit) < 1
                  ? "text-emerald-300"
                  : "text-rose-300",
              )}
            >
              {Math.abs(totalDebit - totalCredit) < 1 ? "✓ Books balance" : "✗ Out of balance"}
            </p>
          </div>

          {selectedEntry ? (
            <div className="glass rounded-[20px] p-5">
              <SectionHeader
                eyebrow={selectedEntry.fiscalPeriod}
                title={selectedEntry.number}
                description={selectedEntry.description}
              />
              <ul className="divide-y divide-white/8">
                {selectedEntry.lines.map((line) => (
                  <li key={line.id} className="grid grid-cols-12 items-baseline gap-2 py-1.5 text-[11px]">
                    <span className="col-span-2 font-mono text-zinc-400">{line.accountCode}</span>
                    <span className="col-span-6 text-zinc-200">{line.accountName}</span>
                    <span className="col-span-2 text-right font-mono text-emerald-300">
                      {line.debit > 0 ? formatIDRCompact(line.debit) : ""}
                    </span>
                    <span className="col-span-2 text-right font-mono text-sky-300">
                      {line.credit > 0 ? formatIDRCompact(line.credit) : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 grid grid-cols-12 gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 text-[11px] font-semibold">
                <span className="col-span-8 text-zinc-200">Totals</span>
                <span className="col-span-2 text-right font-mono text-emerald-300">
                  {formatIDRCompact(selectedEntry.totalDebit)}
                </span>
                <span className="col-span-2 text-right font-mono text-sky-300">
                  {formatIDRCompact(selectedEntry.totalCredit)}
                </span>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                {selectedEntry.postedBy
                  ? `Posted by ${selectedEntry.postedBy}`
                  : "Awaiting approval"}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Journals"
          title={`Journal entries (${mockJournalEntries.length})`}
          description="Click a row to inspect its double-entry lines on the right."
        />
        <DataTable
          rows={mockJournalEntries}
          columns={journalColumns}
          rowKey={(e) => e.id}
          onRowClick={(e) => setSelectedEntry(e)}
          dense
        />
      </div>
    </div>
  );
}
