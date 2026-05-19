"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Percent,
  Plus,
  RotateCcw,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { useCommercialStore } from "@/state/commercial.store";
import {
  totalVendorCost,
  projectMargin,
  projectMarginRatio,
  type ProjectCostingStatus,
} from "@/domain/entities/ProjectCosting";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { BulkImportDialog, type ImportFieldDef } from "@/presentation/shared/BulkImportDialog";
import { formatIDR, formatIDRCompact, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<ProjectCostingStatus, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Discovery: "info",
  "In Progress": "wit",
  "Invoice Sent": "info",
  Completed: "success",
  "On Hold": "warning",
  Cancelled: "danger",
};

const STATUS_OPTIONS: ProjectCostingStatus[] = [
  "Discovery",
  "In Progress",
  "Invoice Sent",
  "Completed",
  "On Hold",
  "Cancelled",
];

type StatusFilter = "all" | ProjectCostingStatus;

const IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "projectCode", label: "Project Code", example: "PRJ-25/...", type: "string", required: true },
  { key: "projectName", label: "Project Name", type: "string", required: true },
  { key: "clientName", label: "Client", type: "string", required: true },
  { key: "totalValue", label: "Total Value (Rp)", type: "currency" },
  { key: "vendor1Name", label: "Vendor 1 name", type: "string" },
  { key: "vendor1Amount", label: "Vendor 1 price", type: "currency" },
  { key: "vendor2Name", label: "Vendor 2 name", type: "string" },
  { key: "vendor2Amount", label: "Vendor 2 price", type: "currency" },
  { key: "vendor3Name", label: "Vendor 3 name", type: "string" },
  { key: "vendor3Amount", label: "Vendor 3 price", type: "currency" },
  { key: "status", label: "Status", type: "string" },
  { key: "termOfPaymentClient", label: "Term · client", example: "3x (50-30-20)", type: "string" },
];

export function ProjectCommercialPanel() {
  const costings = useCommercialStore((s) => s.costings);
  const updateCosting = useCommercialStore((s) => s.updateCosting);
  const updateVendor = useCommercialStore((s) => s.updateVendor);
  const addCosting = useCommercialStore((s) => s.addCosting);
  const deleteCosting = useCommercialStore((s) => s.deleteCosting);
  const bulkImportCostings = useCommercialStore((s) => s.bulkImportCostings);
  const resetAll = useCommercialStore((s) => s.resetAll);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [importOpen, setImportOpen] = useState(false);

  const enriched = useMemo(
    () =>
      costings.map((p) => ({
        ...p,
        vendorTotal: totalVendorCost(p),
        margin: projectMargin(p),
        marginRatio: projectMarginRatio(p),
      })),
    [costings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.vendors.some((v) => v.vendor.toLowerCase().includes(q))
      );
    });
  }, [enriched, query, statusFilter]);

  const totalValued = enriched.reduce((s, p) => s + p.totalValue, 0);
  const totalMargin = enriched.reduce((s, p) => s + p.margin, 0);
  const marginRatio = totalValued > 0 ? (totalMargin / totalValued) * 100 : 0;
  const inProgress = enriched.filter((p) => p.status === "In Progress").length;
  const thinMargin = enriched.filter((p) => p.marginRatio < 5 && p.totalValue > 0).length;

  const maxVendors = Math.max(...enriched.map((p) => p.vendors.length), 3);
  const vendorColumns = Array.from({ length: maxVendors }, (_, i) => i);

  const statuses: StatusFilter[] = ["all", "In Progress", "Invoice Sent", "Completed", "On Hold"];

  const onAddRow = () => {
    addCosting({
      projectCode: `PRJ-NEW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      projectName: "New project",
      clientName: "—",
      totalValue: 0,
      vendors: [
        { vendor: "Vendor 1", amount: 0 },
        { vendor: "Vendor 2", amount: 0 },
      ],
      status: "Discovery",
      termOfPaymentClient: "1x (100)",
      termOfPaymentVendor: "1x (100)",
      ownerName: "—",
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          emphasis
          icon={TrendingUp}
          label="Total Valued"
          value={formatIDRCompact(totalValued)}
          delta={`${enriched.length} projects`}
          trend="up"
        />
        <MetricCard
          icon={Wallet}
          label="Total Margin"
          value={formatIDRCompact(totalMargin)}
          accent="#34D399"
          trend={totalMargin > 0 ? "up" : "down"}
        />
        <MetricCard
          icon={Percent}
          label="Margin Ratio"
          value={formatPercent(marginRatio, 2)}
          accent="#FBBF24"
          trend={marginRatio > 20 ? "up" : "down"}
        />
        <MetricCard
          icon={Briefcase}
          label="In Progress"
          value={String(inProgress)}
          accent="#3B82F6"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Thin Margin (<5%)"
          value={String(thinMargin)}
          accent="#F87171"
          trend={thinMargin > 0 ? "down" : "flat"}
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Project Commercial"
          title={`Vendor margin tracker (${filtered.length})`}
          description="Click any cell to edit. Totals + margin recompute automatically and persist to localStorage."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Project, client, vendor…"
                className="w-full sm:w-auto md:w-72"
              />
              <button
                onClick={() => setImportOpen(true)}
                className="glass-soft inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-200 hover:border-white/25"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
              <button
                onClick={onAddRow}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30"
              >
                <Plus className="h-3 w-3" />
                New project
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && !window.confirm("Reset all costings + termins to seed defaults?")) return;
                  resetAll();
                }}
                title="Reset to seed defaults"
                className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
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

        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">No</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Project</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Client</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Total value</th>
                {vendorColumns.map((i) => (
                  <th key={i} className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Vendor {i + 1}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Margin</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">%</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Status</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Term · client</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">·</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className={cn(
                    "border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                    idx % 2 === 1 && "bg-white/[0.015]",
                  )}
                >
                  <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-[10px] text-zinc-400">
                      <EditableCell
                        value={p.projectCode}
                        type="text"
                        onSave={(v) => updateCosting(p.id, { projectCode: String(v) })}
                      />
                    </div>
                    <div className="text-xs font-semibold text-zinc-100">
                      <EditableCell
                        value={p.projectName}
                        type="text"
                        onSave={(v) => updateCosting(p.id, { projectName: String(v) })}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-zinc-300">
                    <EditableCell
                      value={p.clientName}
                      type="text"
                      onSave={(v) => updateCosting(p.id, { clientName: String(v) })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <EditableCell
                      value={p.totalValue}
                      type="currencyCompact"
                      onSave={(v) => updateCosting(p.id, { totalValue: Number(v) })}
                      displayClassName="font-mono text-xs text-zinc-100"
                    />
                  </td>
                  {vendorColumns.map((i) => {
                    const v = p.vendors[i];
                    return (
                      <td key={i} className="px-3 py-2 text-right">
                        <div className="text-[10px] text-zinc-400">
                          <EditableCell
                            value={v?.vendor ?? ""}
                            type="text"
                            placeholder="Vendor"
                            onSave={(value) => {
                              const next = [...p.vendors];
                              if (next[i]) {
                                updateVendor(p.id, i, { vendor: String(value) });
                              } else if (String(value).trim()) {
                                // append a new vendor row at index i, padding empties
                                while (next.length < i) next.push({ vendor: "", amount: 0 });
                                next[i] = { vendor: String(value), amount: 0 };
                                updateCosting(p.id, { vendors: next });
                              }
                            }}
                          />
                        </div>
                        <div className="font-mono text-[11px] text-zinc-200">
                          <EditableCell
                            value={v?.amount ?? 0}
                            type="currencyCompact"
                            onSave={(value) => {
                              const next = [...p.vendors];
                              if (next[i]) {
                                updateVendor(p.id, i, { amount: Number(value) });
                              } else if (Number(value) > 0) {
                                while (next.length < i) next.push({ vendor: "", amount: 0 });
                                next[i] = { vendor: `Vendor ${i + 1}`, amount: Number(value) };
                                updateCosting(p.id, { vendors: next });
                              }
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono text-xs font-semibold",
                      p.margin < 0
                        ? "text-rose-300"
                        : p.marginRatio < 5
                          ? "text-amber-300"
                          : "text-emerald-300",
                    )}
                  >
                    {formatIDRCompact(p.margin)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono text-[11px]",
                      p.marginRatio < 0
                        ? "text-rose-300"
                        : p.marginRatio < 5
                          ? "text-amber-300"
                          : p.marginRatio < 25
                            ? "text-sky-300"
                            : "text-emerald-300",
                    )}
                  >
                    {formatPercent(p.marginRatio, 1)}
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={p.status}
                      type="select"
                      options={STATUS_OPTIONS}
                      onSave={(v) =>
                        updateCosting(p.id, { status: v as ProjectCostingStatus })
                      }
                      displayClassName={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1",
                        STATUS_TONE[p.status] === "success" && "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
                        STATUS_TONE[p.status] === "warning" && "bg-amber-500/15 text-amber-300 ring-amber-400/30",
                        STATUS_TONE[p.status] === "danger" && "bg-rose-500/15 text-rose-300 ring-rose-400/30",
                        STATUS_TONE[p.status] === "info" && "bg-sky-500/15 text-sky-300 ring-sky-400/30",
                        STATUS_TONE[p.status] === "wit" && "bg-white/10 text-zinc-50 ring-white/20",
                        STATUS_TONE[p.status] === "neutral" && "bg-white/8 text-zinc-200 ring-white/10",
                      )}
                    />
                  </td>
                  <td className="px-3 py-2 text-[10px] text-zinc-300">
                    <EditableCell
                      value={p.termOfPaymentClient}
                      type="text"
                      onSave={(v) => updateCosting(p.id, { termOfPaymentClient: String(v) })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined" && !window.confirm("Delete this project?")) return;
                        deleteCosting(p.id);
                      }}
                      aria-label="Delete project"
                      className="grid h-6 w-6 place-items-center rounded-md text-zinc-500 hover:bg-rose-500/12 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-white/[0.04]">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-300">
                  Totals · {filtered.length} projects
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-zinc-50">
                  {formatIDR(filtered.reduce((s, p) => s + p.totalValue, 0))}
                </td>
                {vendorColumns.map((i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono text-[11px] text-zinc-400">
                    {formatIDRCompact(filtered.reduce((s, p) => s + (p.vendors[i]?.amount ?? 0), 0))}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-emerald-300">
                  {formatIDR(filtered.reduce((s, p) => s + p.margin, 0))}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-300">—</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <BulkImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import projects"
        description="Paste rows from your FS PRO sheet. Tab- or comma-separated. First row should be the header."
        sample={`Project Code\tProject Name\tClient\tTotal Value (Rp)\tVendor 1 name\tVendor 1 price\tVendor 2 name\tVendor 2 price\tStatus\tTerm · client\nPRJ-25/CLNT/EXAMPLE-001\tExample Project\tACME GOLD\t100000000\tWIT.SBY\t40000000\tPlabs\t30000000\tIn Progress\t2x (70-30)`}
        fields={IMPORT_FIELDS}
        buildRow={(m) => ({
          projectCode: String(m.projectCode || "PRJ-NEW"),
          projectName: String(m.projectName || ""),
          clientName: String(m.clientName || ""),
          totalValue: Number(m.totalValue || 0),
          vendors: [
            m.vendor1Name || m.vendor1Amount
              ? { vendor: String(m.vendor1Name || "Vendor 1"), amount: Number(m.vendor1Amount || 0) }
              : null,
            m.vendor2Name || m.vendor2Amount
              ? { vendor: String(m.vendor2Name || "Vendor 2"), amount: Number(m.vendor2Amount || 0) }
              : null,
            m.vendor3Name || m.vendor3Amount
              ? { vendor: String(m.vendor3Name || "Vendor 3"), amount: Number(m.vendor3Amount || 0) }
              : null,
          ].filter(Boolean) as { vendor: string; amount: number }[],
          status: ((s: unknown): ProjectCostingStatus => {
            const str = String(s ?? "In Progress");
            return (STATUS_OPTIONS as string[]).includes(str)
              ? (str as ProjectCostingStatus)
              : "In Progress";
          })(m.status),
          termOfPaymentClient: String(m.termOfPaymentClient || "1x (100)"),
          ownerName: "—",
        })}
        onIngest={(rows) => {
          bulkImportCostings(rows);
        }}
      />
    </div>
  );
}
