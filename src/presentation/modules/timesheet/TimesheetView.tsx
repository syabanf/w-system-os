"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Clock, FileText, Gauge, Pencil, Plus, Trash2 } from "lucide-react";
import type { TimesheetEntry } from "@/domain/entities/Timesheet";
import type { TimesheetSummary } from "@/application/use-cases/timesheet/GetTimesheetSummary";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { useTimesheetStore } from "@/state/timesheet.store";
import { useToast } from "@/state/toast.store";
import { useHotkey } from "@/hooks/useHotkey";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { WeeklyTimesheetGrid } from "./WeeklyTimesheetGrid";
import { ProductivityChart } from "./ProductivityChart";
import { TimeEntryFormDialog } from "./TimeEntryFormDialog";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { EmptyState } from "@/presentation/shared/EmptyState";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { ClientFilterSelect } from "@/presentation/shared/ClientFilterSelect";
import { formatPercent } from "@/lib/currency";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

type EnrichedEntry = TimesheetEntry & { memberName: string; projectName: string };
type Row = EnrichedEntry;

export function TimesheetView() {
  const entries = useTimesheetStore((s) => s.items);
  const hydrate = useTimesheetStore((s) => s.hydrate);
  const addEntry = useTimesheetStore((s) => s.add);
  const updateEntry = useTimesheetStore((s) => s.update);
  const removeEntry = useTimesheetStore((s) => s.remove);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimesheetEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TimesheetEntry | null>(null);
  const [clientFilter, setClientFilter] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Timesheet entries carry a projectId, not a clientId — resolve the client
  // through the project so the "Filter by client" control can scope everything.
  const projClientMap = useMemo(
    () => new Map(mockProjects.map((p) => [p.id, p.clientId])),
    [],
  );
  const filteredEntries = useMemo(
    () => entries.filter((e) => !clientFilter || projClientMap.get(e.projectId) === clientFilter),
    [entries, clientFilter, projClientMap],
  );

  // ⌘N / Ctrl-N opens the "Log time" dialog when this view is focused.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    setEditing(null);
    setFormOpen(true);
  });

  // Derive the summary from store entries — keeps charts + metrics live as
  // entries are added / edited / removed.
  const summary: TimesheetSummary = useMemo(() => {
    const memberMap = new Map(mockTeam.map((m) => [m.id, m.name]));
    const projectMap = new Map(mockProjects.map((p) => [p.id, p.name]));
    const enriched: EnrichedEntry[] = filteredEntries.map((e) => ({
      ...e,
      memberName: memberMap.get(e.memberId) ?? "Unknown",
      projectName: projectMap.get(e.projectId) ?? "Unknown",
    }));
    const totalHours = filteredEntries.reduce((s, e) => s + e.hours, 0);
    const billableHours = filteredEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
    const dayMap = new Map<string, { total: number; billable: number }>();
    filteredEntries.forEach((e) => {
      const cur = dayMap.get(e.date) ?? { total: 0, billable: 0 };
      cur.total += e.hours;
      if (e.billable) cur.billable += e.hours;
      dayMap.set(e.date, cur);
    });
    const byDay = Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      entries: enriched,
      totalHours,
      billableHours,
      billableRatio: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
      pendingApproval: filteredEntries.filter((e) => e.approvalStatus === "submitted").length,
      byDay,
    };
  }, [filteredEntries]);

  const pendingRows = summary.entries
    .filter((e) => e.approvalStatus === "submitted")
    .slice(0, 8);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (entry: TimesheetEntry) => {
    setEditing(entry);
    setFormOpen(true);
  };

  const columns: Column<Row>[] = [
    { key: "member", header: "Member", render: (r) => <span className="text-xs text-zinc-100">{r.memberName}</span> },
    { key: "project", header: "Project", render: (r) => <span className="text-[11px] text-zinc-300">{r.projectName}</span> },
    { key: "date", header: "Date", render: (r) => <span className="text-xs">{r.date}</span> },
    {
      key: "hours",
      header: "Hours",
      align: "right",
      render: (r) => <span className="font-mono text-xs text-zinc-200">{r.hours}h</span>,
    },
    {
      key: "billable",
      header: "Billable",
      render: (r) => (
        <StatusBadge tone={r.billable ? "success" : "neutral"}>
          {r.billable ? "Yes" : "No"}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Approval",
      render: (r) => (
        <StatusBadge
          tone={
            r.approvalStatus === "approved"
              ? "success"
              : r.approvalStatus === "rejected"
                ? "danger"
                : r.approvalStatus === "submitted"
                  ? "warning"
                  : "neutral"
          }
        >
          {r.approvalStatus}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openEdit(r)}
            aria-label="Edit time entry"
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(r)}
            aria-label="Delete time entry"
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Operations · Timesheet
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">Time & productivity</h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Logged hours, billability mix, and approval pipeline for this week.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClientFilterSelect
            value={clientFilter}
            onChange={setClientFilter}
            className="w-full sm:w-44"
          />
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
            title="Log time (⌘N)"
          >
            <Plus className="h-3 w-3" />
            Log time
          </button>
          <ManageMasterDataButton moduleId="timesheet" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Clock}
          label="Total Hours"
          value={`${summary.totalHours}h`}
          trend="up"
        />
        <MetricCard
          icon={Gauge}
          label="Billable Ratio"
          value={formatPercent(summary.billableRatio, 1)}
          delta={`${summary.billableHours}h billable`}
          trend={summary.billableRatio > 75 ? "up" : "down"}
          accent="#22C55E"
        />
        <MetricCard
          icon={FileText}
          label="Pending Approval"
          value={String(summary.pendingApproval)}
          accent="#F59E0B"
        />
        <MetricCard
          icon={CheckSquare}
          label="Logged Days"
          value={String(summary.byDay.length)}
          accent="#3B82F6"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Productivity (Mon–Fri)"
          description="Billable vs. non-billable per day."
          height={240}
        >
          <ProductivityChart data={summary.byDay} />
        </ChartCard>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Approvals" title="Awaiting review" />
          <DataTable<Row>
            columns={[
              { key: "m", header: "Member", render: (r) => <span className="text-xs">{r.memberName}</span> },
              { key: "p", header: "Project", render: (r) => <span className="text-[11px] text-zinc-300">{r.projectName}</span> },
              { key: "h", header: "Hours", align: "right", render: (r) => <span className="font-mono text-xs">{r.hours}h</span> },
            ]}
            rows={pendingRows}
            rowKey={(r) => r.id}
            dense
            empty="No pending submissions."
          />
        </div>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Weekly grid" title="Logged hours" />
        <WeeklyTimesheetGrid summary={summary} />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Detail"
          title={`Entries (${summary.entries.length})`}
          description="Click the pencil to edit, trash to remove. Press ⌘N to log a new entry."
          action={
            summary.entries.length > 0 ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
              >
                <Plus className="h-3 w-3" />
                Log time
              </button>
            ) : null
          }
        />
        {summary.entries.length > 0 ? (
          <DataTable<Row> columns={columns} rows={summary.entries} rowKey={(r) => r.id} dense />
        ) : (
          <EmptyState
            icon={Clock}
            title="No time entries yet"
            description="Log your first entry to track hours per project, billable mix, and approval flow."
            actionLabel="Log your first entry"
            onAction={openCreate}
          />
        )}
      </div>

      <TimeEntryFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateEntry(editingId, draft);
            toast.success("Entry updated", `${draft.hours}h on ${draft.date}`);
          } else {
            addEntry(draft);
            toast.success("Time logged", `${draft.hours}h on ${draft.date}`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Remove time entry?"
        description={
          confirmDelete
            ? `${confirmDelete.hours}h on ${confirmDelete.date} will be removed from the timesheet. Approval history is preserved.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const label = `${confirmDelete.hours}h on ${confirmDelete.date}`;
          removeEntry(confirmDelete.id);
          setConfirmDelete(null);
          toast.info("Entry removed", label);
        }}
      />
    </div>
  );
}
