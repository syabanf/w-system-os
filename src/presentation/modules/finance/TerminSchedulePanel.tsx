"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CalendarClock,
  Clock,
  FileText,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import { useCommercialStore } from "@/state/commercial.store";
import type {
  InstallmentType,
  TerminInstallment,
  TerminStatus,
} from "@/domain/entities/ProjectTermin";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { BulkImportDialog, type ImportFieldDef } from "@/presentation/shared/BulkImportDialog";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<TerminStatus, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Paid: "success",
  Invoiced: "info",
  Due: "warning",
  Upcoming: "neutral",
  Overdue: "danger",
  Pending: "neutral",
};

const STATUS_OPTIONS: TerminStatus[] = ["Paid", "Invoiced", "Due", "Upcoming", "Overdue", "Pending"];

const INSTALLMENT_TYPES: InstallmentType[] = [
  "DP",
  "UAT",
  "BAST",
  "Final",
  "Pekerjaan 25%",
  "Pekerjaan 50%",
  "Pekerjaan 75%",
  "Pekerjaan 100%/Go live",
  "2 Bulan setelah Go live",
  "Penyerahan Rencana Kerja",
  "Procurement Hardware",
  "Manpower Services",
];

const TYPE_TONE: Record<InstallmentType, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  DP: "wit",
  UAT: "info",
  BAST: "info",
  Final: "success",
  "Pekerjaan 25%": "info",
  "Pekerjaan 50%": "info",
  "Pekerjaan 75%": "info",
  "Pekerjaan 100%/Go live": "success",
  "2 Bulan setelah Go live": "neutral",
  "Penyerahan Rencana Kerja": "info",
  "Procurement Hardware": "warning",
  "Manpower Services": "warning",
};

const IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "projectCode", label: "Project Code", required: true, type: "string" },
  { key: "projectName", label: "Project Name", required: true, type: "string" },
  { key: "clientName", label: "Client", type: "string" },
  { key: "totalProjectValue", label: "Project Value (Rp)", type: "currency" },
  { key: "termOfPayment", label: "Term of Payment", example: "3x (50-30-20)", type: "string" },
  { key: "installmentNo", label: "Installment No", type: "number" },
  { key: "installmentType", label: "Installment Type", example: "DP / UAT / BAST", type: "string" },
  { key: "percentage", label: "(%)", type: "number" },
  { key: "amountDue", label: "Amount Due (Rp)", type: "currency" },
  { key: "progressDueDate", label: "Progress Due Date", example: "YYYY-MM-DD", type: "string" },
  { key: "terminDueDate", label: "Termin Due Date", example: "YYYY-MM-DD", type: "string" },
  { key: "status", label: "Status", type: "string" },
];

type StatusFilter = "all" | TerminStatus;
type GroupMode = "project" | "flat";

export function TerminSchedulePanel() {
  const termins = useCommercialStore((s) => s.termins);
  const updateTermin = useCommercialStore((s) => s.updateTermin);
  const deleteTermin = useCommercialStore((s) => s.deleteTermin);
  const bulkImportTermins = useCommercialStore((s) => s.bulkImportTermins);
  const generateTerminsFromScheme = useCommercialStore((s) => s.generateTerminsFromScheme);
  const generateInvoiceFromTermin = useCommercialStore((s) => s.generateInvoiceFromTermin);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("project");
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return termins.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.projectName.toLowerCase().includes(q) ||
        t.projectCode.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.installmentType.toLowerCase().includes(q)
      );
    });
  }, [termins, query, statusFilter]);

  const totalScheduled = termins.reduce((s, t) => s + t.amountDue, 0);
  const totalPaid = termins.filter((t) => t.status === "Paid").reduce((s, t) => s + t.amountDue, 0);
  const totalOutstanding = termins.filter((t) => t.status !== "Paid").reduce((s, t) => s + t.amountDue, 0);
  const overdueCount = termins.filter((t) => t.status === "Overdue").length;
  const dueNextMonthCount = termins.filter(
    (t) =>
      (t.status === "Due" || t.status === "Upcoming" || t.status === "Invoiced") &&
      t.terminDueDate &&
      t.terminDueDate >= "2026-05-19" &&
      t.terminDueDate <= "2026-06-19",
  ).length;

  const statuses: StatusFilter[] = ["all", "Paid", "Invoiced", "Due", "Overdue", "Upcoming", "Pending"];

  // Group rows by project when groupMode === "project"
  const grouped = useMemo(() => {
    const map = new Map<string, TerminInstallment[]>();
    filtered.forEach((t) => {
      const list = map.get(t.projectCode) ?? [];
      list.push(t);
      map.set(t.projectCode, list);
    });
    return Array.from(map.entries()).map(([code, rows]) => ({
      code,
      project: rows[0],
      rows: rows.slice().sort((a, b) => a.installmentNo - b.installmentNo),
      paid: rows.filter((r) => r.status === "Paid").reduce((s, r) => s + r.amountDue, 0),
      total: rows[0].totalProjectValue,
    }));
  }, [filtered]);

  const onGenerateInvoice = (terminId: string) => {
    const result = generateInvoiceFromTermin(terminId);
    if (!result) {
      setToast("Invoice could not be generated — termin is already paid.");
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setToast(`✓ ${result.invoiceNumber} created · journal ${result.journalNumber} posted`);
    setTimeout(() => setToast(null), 4500);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          emphasis
          icon={TrendingUp}
          label="Total Scheduled"
          value={formatIDRCompact(totalScheduled)}
          delta={`${termins.length} installments`}
          trend="up"
        />
        <MetricCard
          icon={Wallet}
          label="Collected"
          value={formatIDRCompact(totalPaid)}
          accent="#34D399"
        />
        <MetricCard
          icon={Clock}
          label="Outstanding"
          value={formatIDRCompact(totalOutstanding)}
          accent="#FBBF24"
        />
        <MetricCard
          icon={AlertOctagon}
          label="Overdue"
          value={String(overdueCount)}
          accent="#F87171"
          trend={overdueCount > 0 ? "down" : "flat"}
        />
        <MetricCard
          icon={CalendarClock}
          label="Due next 30d"
          value={String(dueNextMonthCount)}
          accent="#60A5FA"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Termin Project Monitoring"
          title={`Installment schedule (${filtered.length})`}
          description="Click cells to edit · Auto-generate from payment scheme · Generate Invoice posts to Transactions + GL."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Project, client, installment…"
                className="w-full sm:w-auto md:w-72"
              />
              <button
                onClick={() => setImportOpen(true)}
                className="glass-soft inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-200 hover:border-white/25"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
              <GroupSwitch mode={groupMode} onChange={setGroupMode} />
            </div>
          }
        />

        <div className="mb-3 flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors",
                statusFilter === s
                  ? "border-white/25 bg-white/10 text-zinc-50"
                  : "border-white/8 bg-white/[0.03] text-zinc-400 hover:text-zinc-200",
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {groupMode === "project" ? (
          <ul className="space-y-3">
            {grouped.map((g) => {
              const completion = g.total > 0 ? (g.paid / g.total) * 100 : 0;
              return (
                <li key={g.code} className="glass-soft rounded-2xl border border-white/8 p-4">
                  <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-zinc-400">{g.code}</div>
                      <div className="text-sm font-semibold text-zinc-50">{g.project.projectName}</div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">
                        {g.project.clientName} ·{" "}
                        <span className="font-mono">{g.project.termOfPayment}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-xs text-zinc-100">
                          {formatIDRCompact(g.paid)}{" "}
                          <span className="text-zinc-500">/ {formatIDRCompact(g.total)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-2">
                          <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: `${Math.min(100, completion)}%`,
                                background:
                                  completion >= 100
                                    ? "linear-gradient(90deg, #34D399, #FBBF24)"
                                    : "linear-gradient(90deg, #34D399, #60A5FA)",
                              }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {completion.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const scheme = window.prompt(
                            `Generate termins from a payment scheme.\n\nCurrent: ${g.project.termOfPayment}\n\nExamples: "2x (70-30)", "3x (50-30-20)", "5x (20-25-25-25-5)", "1x (100)", "2x (HW - SW)"`,
                            g.project.termOfPayment,
                          );
                          if (!scheme) return;
                          if (
                            !window.confirm(
                              `This replaces ${g.rows.length} existing termins on ${g.code} with the new scheme.`,
                            )
                          )
                            return;
                          const out = generateTerminsFromScheme({
                            projectCode: g.code,
                            projectName: g.project.projectName,
                            clientName: g.project.clientName,
                            totalProjectValue: g.total,
                            scheme,
                          });
                          if (!out) {
                            setToast("Could not parse that scheme.");
                            setTimeout(() => setToast(null), 3000);
                            return;
                          }
                          setToast(`✓ Generated ${out.generated} termins from ${scheme}`);
                          setTimeout(() => setToast(null), 3500);
                        }}
                        className="glass-soft inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-200 hover:border-white/25"
                        title="Replace termins from payment scheme"
                      >
                        <Zap className="h-3 w-3" />
                        Auto-gen
                      </button>
                    </div>
                  </header>

                  <div className="overflow-x-auto rounded-xl border border-white/6">
                    <table className="w-full min-w-[1100px] text-left text-xs">
                      <thead className="bg-white/[0.03]">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">#</th>
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Type</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">%</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Amount</th>
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Progress</th>
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Termin due</th>
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Paid</th>
                          <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Status</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r) => (
                          <tr key={r.id} className="border-t border-white/5">
                            <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-400">{r.installmentNo}</td>
                            <td className="px-3 py-1.5">
                              <EditableCell
                                value={r.installmentType}
                                type="select"
                                options={INSTALLMENT_TYPES}
                                onSave={(v) => updateTermin(r.id, { installmentType: v as InstallmentType })}
                                displayClassName={cn(
                                  "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1",
                                  TYPE_TONE[r.installmentType] === "success" && "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
                                  TYPE_TONE[r.installmentType] === "warning" && "bg-amber-500/15 text-amber-300 ring-amber-400/30",
                                  TYPE_TONE[r.installmentType] === "info" && "bg-sky-500/15 text-sky-300 ring-sky-400/30",
                                  TYPE_TONE[r.installmentType] === "wit" && "bg-white/10 text-zinc-50 ring-white/20",
                                  TYPE_TONE[r.installmentType] === "neutral" && "bg-white/8 text-zinc-200 ring-white/10",
                                )}
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <EditableCell
                                value={r.percentage}
                                type="percent"
                                onSave={(v) => updateTermin(r.id, { percentage: Number(v) })}
                                displayClassName="font-mono text-[11px] text-zinc-200"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <EditableCell
                                value={r.amountDue}
                                type="currency"
                                onSave={(v) => updateTermin(r.id, { amountDue: Number(v) })}
                                displayClassName="font-mono text-xs text-zinc-100"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-[11px] text-zinc-300">
                              <EditableCell
                                value={r.progressDueDate ?? ""}
                                type="date"
                                placeholder="—"
                                onSave={(v) =>
                                  updateTermin(r.id, {
                                    progressDueDate: String(v) || undefined,
                                  })
                                }
                                displayClassName={r.progressDueDate ? "" : "text-zinc-500"}
                              />
                            </td>
                            <td className="px-3 py-1.5 text-[11px] text-zinc-300">
                              <EditableCell
                                value={r.terminDueDate ?? ""}
                                type="date"
                                placeholder="—"
                                onSave={(v) =>
                                  updateTermin(r.id, {
                                    terminDueDate: String(v) || undefined,
                                  })
                                }
                                displayClassName={r.terminDueDate ? "" : "text-zinc-500"}
                              />
                            </td>
                            <td className="px-3 py-1.5 text-[11px] text-emerald-300">
                              <EditableCell
                                value={r.paidAt ?? ""}
                                type="date"
                                placeholder="—"
                                onSave={(v) =>
                                  updateTermin(r.id, {
                                    paidAt: String(v) || undefined,
                                    status: v ? ("Paid" as TerminStatus) : r.status,
                                  })
                                }
                                displayClassName={r.paidAt ? "" : "text-zinc-500"}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <EditableCell
                                value={r.status}
                                type="select"
                                options={STATUS_OPTIONS}
                                onSave={(v) => updateTermin(r.id, { status: v as TerminStatus })}
                                displayClassName={cn(
                                  "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1",
                                  STATUS_TONE[r.status] === "success" && "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
                                  STATUS_TONE[r.status] === "warning" && "bg-amber-500/15 text-amber-300 ring-amber-400/30",
                                  STATUS_TONE[r.status] === "danger" && "bg-rose-500/15 text-rose-300 ring-rose-400/30",
                                  STATUS_TONE[r.status] === "info" && "bg-sky-500/15 text-sky-300 ring-sky-400/30",
                                  STATUS_TONE[r.status] === "wit" && "bg-white/10 text-zinc-50 ring-white/20",
                                  STATUS_TONE[r.status] === "neutral" && "bg-white/8 text-zinc-200 ring-white/10",
                                )}
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => onGenerateInvoice(r.id)}
                                  disabled={r.status === "Paid"}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                                    r.status === "Paid"
                                      ? "bg-white/[0.05] text-zinc-500"
                                      : r.status === "Invoiced"
                                        ? "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
                                        : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
                                  )}
                                  title={
                                    r.status === "Paid"
                                      ? "Already paid"
                                      : r.status === "Invoiced"
                                        ? "Invoice already generated — regenerates"
                                        : "Generate invoice + post journal entry"
                                  }
                                >
                                  <FileText className="h-2.5 w-2.5" />
                                  {r.status === "Invoiced" ? "Regen invoice" : "Gen invoice"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (typeof window !== "undefined" && !window.confirm("Delete this termin?")) return;
                                    deleteTermin(r.id);
                                  }}
                                  aria-label="Delete termin"
                                  className="grid h-6 w-6 place-items-center rounded-md text-zinc-500 hover:bg-rose-500/12 hover:text-rose-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              );
            })}
            {grouped.length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
                No installments match the current filters.
              </li>
            ) : null}
          </ul>
        ) : (
          <FlatTable
            rows={filtered}
            onUpdate={updateTermin}
            onDelete={deleteTermin}
            onGenerateInvoice={onGenerateInvoice}
          />
        )}

        <div className="glass-soft mt-4 flex items-start gap-2 rounded-2xl border border-white/8 p-3 text-[11px] text-zinc-300">
          <Sparkles className="h-3 w-3 shrink-0 text-zinc-200" />
          <span>
            Tip: <strong className="font-semibold text-zinc-100">Auto-gen</strong> on a project
            parses schemes like <span className="font-mono">2x (70-30)</span>,{" "}
            <span className="font-mono">3x (50-30-20)</span>,{" "}
            <span className="font-mono">5x (20-25-25-25-5)</span>, or{" "}
            <span className="font-mono">2x (HW - SW)</span>.{" "}
            <strong className="font-semibold text-zinc-100">Gen invoice</strong> creates an invoice
            in Transactions and posts a balanced journal entry (Debit AR · Credit Revenue · Credit
            PPN Payable).
          </span>
        </div>
      </div>

      <BulkImportDialog<TerminInstallment>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import termin schedule"
        description="Paste rows from your FS PRO Termin Project Monitoring sheet."
        sample={`Project Code\tProject Name\tClient\tProject Value\tTerm of Payment\tInstallment No\tInstallment Type\t(%)\tAmount Due\tProgress Due Date\tTermin Due Date\tStatus\nPRJ-25/EX/EXAMPLE-001\tExample\tACME GOLD\t100000000\t2x (70-30)\t1\tDP\t70\t70000000\t2026-01-10\t2026-01-20\tPaid`}
        fields={IMPORT_FIELDS}
        buildRow={(m) => {
          const type = (s: unknown): InstallmentType => {
            const str = String(s ?? "DP");
            return (INSTALLMENT_TYPES as string[]).includes(str)
              ? (str as InstallmentType)
              : "DP";
          };
          const status = (s: unknown): TerminStatus => {
            const str = String(s ?? "Pending");
            return (STATUS_OPTIONS as string[]).includes(str)
              ? (str as TerminStatus)
              : "Pending";
          };
          return {
            id: "",
            projectCode: String(m.projectCode || "PRJ-NEW"),
            projectName: String(m.projectName || ""),
            clientName: String(m.clientName || "—"),
            totalProjectValue: Number(m.totalProjectValue || 0),
            termOfPayment: String(m.termOfPayment || "1x (100)"),
            installmentNo: Number(m.installmentNo || 1),
            installmentType: type(m.installmentType),
            percentage: Number(m.percentage || 0),
            amountDue: Number(m.amountDue || 0),
            progressDueDate: m.progressDueDate ? String(m.progressDueDate) : undefined,
            terminDueDate: m.terminDueDate ? String(m.terminDueDate) : undefined,
            status: status(m.status),
          } as TerminInstallment;
        }}
        onIngest={(rows) => {
          bulkImportTermins(rows.map(({ id: _id, ...rest }) => rest));
        }}
      />

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs text-white shadow-lg ring-1 ring-white/15">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function GroupSwitch({
  mode,
  onChange,
}: {
  mode: GroupMode;
  onChange: (m: GroupMode) => void;
}) {
  const opts: { id: GroupMode; label: string }[] = [
    { id: "project", label: "Group by project" },
    { id: "flat", label: "Flat list" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[10px]">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            mode === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface FlatTableProps {
  rows: TerminInstallment[];
  onUpdate: (id: string, patch: Partial<TerminInstallment>) => void;
  onDelete: (id: string) => void;
  onGenerateInvoice: (id: string) => void;
}

function FlatTable({ rows, onUpdate, onDelete, onGenerateInvoice }: FlatTableProps) {
  const sorted = rows.slice().sort((a, b) => {
    const aDate = a.terminDueDate ?? "9999-12-31";
    const bDate = b.terminDueDate ?? "9999-12-31";
    return aDate.localeCompare(bDate);
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8">
      <table className="w-full min-w-[1100px] text-left text-xs">
        <thead className="bg-white/[0.03]">
          <tr>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Project</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Term</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">#</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Type</th>
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">%</th>
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Amount</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Termin due</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Status</th>
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.id}
              className={cn(
                "border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                i % 2 === 1 && "bg-white/[0.015]",
              )}
            >
              <td className="px-3 py-1.5">
                <div className="font-mono text-[10px] text-zinc-400">{r.projectCode}</div>
                <div className="text-[11px] text-zinc-100">{r.projectName}</div>
              </td>
              <td className="px-3 py-1.5 font-mono text-[10px] text-zinc-400">{r.termOfPayment}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-400">{r.installmentNo}</td>
              <td className="px-3 py-1.5">
                <StatusBadge tone={TYPE_TONE[r.installmentType]}>{r.installmentType}</StatusBadge>
              </td>
              <td className="px-3 py-1.5 text-right">
                <EditableCell
                  value={r.percentage}
                  type="percent"
                  onSave={(v) => onUpdate(r.id, { percentage: Number(v) })}
                  displayClassName="font-mono text-[11px] text-zinc-200"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <EditableCell
                  value={r.amountDue}
                  type="currency"
                  onSave={(v) => onUpdate(r.id, { amountDue: Number(v) })}
                  displayClassName="font-mono text-xs text-zinc-100"
                />
              </td>
              <td className="px-3 py-1.5 text-[11px] text-zinc-300">
                <EditableCell
                  value={r.terminDueDate ?? ""}
                  type="date"
                  placeholder="—"
                  onSave={(v) => onUpdate(r.id, { terminDueDate: String(v) || undefined })}
                  displayClassName={r.terminDueDate ? "" : "text-zinc-500"}
                />
              </td>
              <td className="px-3 py-1.5">
                <StatusBadge tone={STATUS_TONE[r.status]} dot>
                  {r.status}
                </StatusBadge>
              </td>
              <td className="px-3 py-1.5 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => onGenerateInvoice(r.id)}
                    disabled={r.status === "Paid"}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                      r.status === "Paid"
                        ? "bg-white/[0.05] text-zinc-500"
                        : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
                    )}
                  >
                    <FileText className="h-2.5 w-2.5" />
                    Gen invoice
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    aria-label="Delete"
                    className="grid h-6 w-6 place-items-center rounded-md text-zinc-500 hover:bg-rose-500/12 hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
