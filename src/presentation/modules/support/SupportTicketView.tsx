"use client";

import { useEffect, useMemo, useState } from "react";
import { AlarmClock, AlertOctagon, ChevronDown, ChevronsUpDown, ChevronUp, GitPullRequest, LifeBuoy, Pencil, Trash2 } from "lucide-react";
import { createSupportService } from "@/application/factories/createSupportService";
import type {
  EnrichedTicket,
  TicketSLAOverview,
} from "@/application/use-cases/support/GetTicketSLAOverview";
import type { Ticket } from "@/domain/entities/Ticket";
import { hoursUntilSLA, isSLAAtRisk, isSLABreached } from "@/domain/rules/sla.rules";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useTicketsStore } from "@/state/tickets.store";
import { useToast } from "@/state/toast.store";
import { bulkDeleteWithUndo } from "@/lib/bulkDelete";
import { useCommandIntentStore } from "@/state/commandIntent.store";
import { useHotkey } from "@/hooks/useHotkey";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionBar } from "@/presentation/shared/BulkActionBar";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { type Column } from "@/presentation/shared/DataTable";
import { cn } from "@/lib/cn";
import { TicketDetailView } from "./TicketDetailView";
import { SLARiskPanel } from "./SLARiskPanel";
import { TicketFormDialog } from "./TicketFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { NewButton } from "@/presentation/shared/NewButton";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { DrillHeader } from "@/presentation/shared/DrillHeader";
import { DrillCue } from "@/presentation/shared/DrillCue";
import { useDrillState } from "@/state/drill.store";

const NOW = new Date("2026-05-18T09:00:00Z");

function enrich(ticket: Ticket): EnrichedTicket {
  const client = mockClients.find((c) => c.id === ticket.clientId);
  const project = mockProjects.find((p) => p.id === ticket.projectId);
  const assignee = mockTeam.find((m) => m.id === ticket.assignedToId);
  return {
    ...ticket,
    clientName: client?.name ?? "Unknown",
    projectName: project?.name ?? "Unknown",
    assigneeName: assignee?.name ?? "Unassigned",
    hoursUntilSLA: hoursUntilSLA(ticket, NOW),
    isAtRisk: isSLAAtRisk(ticket, NOW),
    isBreached: isSLABreached(ticket, NOW),
  };
}

const SEVERITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  low: "info",
  medium: "warning",
  high: "warning",
  critical: "danger",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Open: "danger",
  Investigating: "warning",
  "Waiting Client": "info",
  "In Progress": "wit",
  Resolved: "success",
  Closed: "neutral",
};

// Logical severity order so the Severity column sorts by urgency, not alphabet.
const SEVERITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

type SortDir = "asc" | "desc";
type SortState = { key: string; dir: SortDir } | null;

/**
 * A column that can be sorted. Extends the shared {@link Column} with an
 * optional `sortValue` extractor — when present the header becomes a clickable
 * sort toggle. Columns without `sortValue` (e.g. action columns) stay static.
 */
type SortableColumn<T> = Column<T> & {
  sortValue?: (row: T) => string | number | null | undefined;
};

/** Compare two extracted sort values, sorting nullish to the end of "asc". */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * Sortable, sticky-header ticket table. Clicking a column header toggles
 * asc ⇄ desc (then off); the active column shows a caret. Sorting returns a
 * sorted COPY of `rows` — the source array is never mutated. The header stays
 * pinned while the body scrolls inside the bordered container.
 */
function SortableTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowAriaLabel,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: {
  columns: SortableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowAriaLabel?: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (visibleIds: string[]) => void;
}) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const extract = col.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    // Sort a COPY — never mutate the source rows array.
    return [...rows].sort((a, b) => compareValues(extract(a), extract(b)) * factor);
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev && prev.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );

  const showSelect = !!selectable && !!selectedIds && !!onToggleRow;
  // Select-all reflects the *sorted* (visible) rows so it respects ordering.
  const visibleIds = showSelect ? sortedRows.map(rowKey) : [];
  const allOn = showSelect && visibleIds.length > 0 && visibleIds.every((id) => selectedIds!.has(id));
  const someOn = showSelect && !allOn && visibleIds.some((id) => selectedIds!.has(id));

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
        No tickets in the queue.
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-auto rounded-2xl border border-white/8">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white/[0.03] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70">
          <tr>
            {showSelect ? (
              <th className="px-4 py-3" style={{ width: "2.5rem" }}>
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allOn}
                  ref={(el) => {
                    if (el) el.indeterminate = someOn;
                  }}
                  onChange={() => onToggleAll?.(visibleIds)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-white/25 bg-white/5 accent-blue-500"
                />
              </th>
            ) : null}
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const sortable = Boolean(col.sortValue);
              return (
                <th
                  key={col.key}
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                  style={{ width: col.width }}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-zinc-100",
                        col.align === "right" && "flex-row-reverse",
                        active && "text-zinc-100",
                      )}
                    >
                      {col.header}
                      {active ? (
                        sort!.dir === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 text-zinc-600" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => {
            const id = rowKey(row);
            const selected = showSelect && selectedIds!.has(id);
            return (
            <tr
              key={id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              role={onRowClick ? "button" : undefined}
              aria-label={onRowClick ? rowAriaLabel?.(row) : undefined}
              className={cn(
                "group border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                onRowClick && "cursor-pointer",
                i % 2 === 1 && "bg-white/[0.015]",
                selected && "bg-blue-500/10 hover:bg-blue-500/15",
              )}
            >
              {showSelect ? (
                <td className="px-4" style={{ width: "2.5rem" }}>
                  <input
                    type="checkbox"
                    aria-label="Select row"
                    checked={!!selected}
                    onChange={() => onToggleRow?.(id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-white/25 bg-white/5 accent-blue-500"
                  />
                </td>
              ) : null}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-2 text-xs text-zinc-200",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The support queue table — replicated inline (was the shared `TicketQueue`
 * component) so it can carry sortable, sticky headers. Severity sorts by
 * urgency rank and SLA sorts by hours-until-deadline; the title/status/assignee
 * columns sort textually.
 */
function TicketQueue({
  rows,
  onRowClick,
  selection,
  onUpdate,
}: {
  rows: EnrichedTicket[];
  onRowClick?: (t: EnrichedTicket) => void;
  selection?: ReturnType<typeof useRowSelection>;
  onUpdate?: (id: string, patch: Partial<Ticket>) => void;
}) {
  const update = onUpdate ?? (() => {});
  const columns: SortableColumn<EnrichedTicket>[] = [
    {
      key: "title",
      header: "Ticket",
      sortValue: (t) => t.title,
      render: (t) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-400">{t.code}</span>
            {t.isChangeRequest ? <StatusBadge tone="info">CR</StatusBadge> : null}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-zinc-100">
            <EditableCell
              value={t.title}
              type="text"
              onSave={(v) => update(t.id, { title: v as string })}
            />
          </div>
          <div className="text-[10px] text-zinc-400">
            {t.clientName} · {t.projectName}
          </div>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (t) => SEVERITY_RANK[t.severity] ?? -1,
      render: (t) => (
        <EditableCell
          value={t.severity}
          type="select"
          options={["critical", "high", "medium", "low"]}
          onSave={(v) => update(t.id, { severity: v as Ticket["severity"] })}
          displayRender={(v) => (
            <StatusBadge tone={SEVERITY_TONE[v as string] ?? "neutral"} dot>
              {v as string}
            </StatusBadge>
          )}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => t.status,
      render: (t) => (
        <EditableCell
          value={t.status}
          type="select"
          options={["Open", "Investigating", "In Progress", "Waiting Client", "Resolved", "Closed"]}
          onSave={(v) => update(t.id, { status: v as Ticket["status"] })}
          displayRender={(v) => (
            <StatusBadge tone={STATUS_TONE[v as string] ?? "neutral"}>{v as string}</StatusBadge>
          )}
        />
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      sortValue: (t) => t.assigneeName,
      render: (t) => <span className="text-[11px] text-zinc-300">{t.assigneeName}</span>,
    },
    {
      key: "sla",
      header: "SLA",
      align: "right",
      sortValue: (t) => t.hoursUntilSLA,
      render: (t) => {
        if (t.status === "Resolved" || t.status === "Closed")
          return <span className="text-[11px] text-zinc-500">—</span>;
        if (t.isBreached) {
          return (
            <span className="font-mono text-[11px] text-rose-300">
              {`${Math.abs(Math.round(t.hoursUntilSLA))}h overdue`}
            </span>
          );
        }
        if (t.isAtRisk) {
          return (
            <span className="font-mono text-[11px] text-amber-300">
              {`${Math.round(t.hoursUntilSLA * 10) / 10}h left`}
            </span>
          );
        }
        return (
          <span className="font-mono text-[11px] text-emerald-300">
            {`${Math.round(t.hoursUntilSLA)}h left`}
          </span>
        );
      },
    },
    {
      key: "drill",
      header: "",
      align: "right",
      render: () => (
        <span className="flex justify-end">
          <DrillCue label="Open" />
        </span>
      ),
    },
  ];

  return (
    <SortableTable<EnrichedTicket>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      onRowClick={onRowClick}
      rowAriaLabel={(t) => `Open ticket ${t.code} ${t.title}`}
      selectable={!!selection}
      selectedIds={selection?.selectedIds}
      onToggleRow={selection?.toggle}
      onToggleAll={selection?.toggleAll}
    />
  );
}

export function SupportTicketView() {
  const [baseline, setBaseline] = useState<TicketSLAOverview | null>(null);
  const [drillId, setDrillId] = useDrillState("support");

  const storeTickets = useTicketsStore((s) => s.items);
  const hydrate = useTicketsStore((s) => s.hydrate);
  const addTicket = useTicketsStore((s) => s.add);
  const updateTicket = useTicketsStore((s) => s.update);
  const removeTicket = useTicketsStore((s) => s.remove);
  const restoreTicket = useTicketsStore((s) => s.restore);
  const toast = useToast();
  const sel = useRowSelection();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [prefillTitle, setPrefillTitle] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<Ticket | null>(null);

  // Reddie / command-surface intent: open the create form (optionally prefilled).
  const intent = useCommandIntentStore((s) => s.intent);
  const clearIntent = useCommandIntentStore((s) => s.clear);
  useEffect(() => {
    if (intent?.module === "support" && intent.action === "create") {
      setEditing(null);
      setPrefillTitle(intent.prefill);
      setFormOpen(true);
      clearIntent();
    }
  }, [intent, clearIntent]);

  useEffect(() => {
    hydrate();
    let cancelled = false;
    (async () => {
      const overview = await createSupportService().getOverview();
      if (!cancelled) setBaseline(overview);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const enriched: EnrichedTicket[] = useMemo(
    () => storeTickets.map(enrich),
    [storeTickets],
  );

  // Live aggregates derived from the store; baseline only contributes
  // averageResolutionHours (a historical metric that doesn't shift on edit).
  const openCount = enriched.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length;
  const breachedCount = enriched.filter((t) => t.isBreached).length;
  const changeRequestCount = enriched.filter((t) => t.isChangeRequest).length;
  const averageResolutionHours = baseline?.averageResolutionHours ?? 0;

  // ⌘N / Ctrl-N → quick "new ticket". MUST be declared before any early return
  // so the hook order stays stable across "loading skeleton" and "loaded" renders.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    setEditing(null);
    setFormOpen(true);
  });

  if (!baseline) return <SkeletonLoadingView />;

  const drillTicket = drillId ? enriched.find((t) => t.id === drillId) ?? null : null;
  const crumbs: Crumb[] = drillTicket
    ? [
        { id: "queue", label: "Queue" },
        { id: drillTicket.id, label: drillTicket.title, sublabel: drillTicket.code },
      ]
    : [{ id: "queue", label: "Queue" }];

  const openCreate = () => {
    setEditing(null);
    setPrefillTitle(undefined);
    setFormOpen(true);
  };
  const openEdit = (t: Ticket) => {
    setEditing(t);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Delivery · Support
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {drillTicket ? "Ticket drill-down" : "Support & change requests"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {drillTicket
              ? "Top-down: queue → ticket → SLA + routing + timeline."
              : "Post-go-live incident queue, SLA pressure, and scope-change impact."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {drillTicket ? (
            <>
              <button
                type="button"
                onClick={() => openEdit(drillTicket)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(drillTicket)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          ) : null}
          <ManageMasterDataButton moduleId="support" />
        </div>
      </header>

      {drillTicket ? (
        <>
          <DrillHeader
            crumbs={crumbs}
            onJump={(i) => i === 0 && setDrillId(null)}
            onBack={() => setDrillId(null)}
            backLabel="Back to queue"
            ariaLabel="Ticket drill-down"
          />
          <TicketDetailView ticket={drillTicket} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              emphasis
              icon={LifeBuoy}
              label="Open Tickets"
              value={String(openCount)}
              trend={openCount > 5 ? "down" : "flat"}
            />
            <MetricCard
              icon={AlertOctagon}
              label="SLA Breached"
              value={String(breachedCount)}
              accent="#EF4444"
              trend={breachedCount > 0 ? "down" : "flat"}
            />
            <MetricCard
              icon={AlarmClock}
              label="Avg Resolution"
              value={`${averageResolutionHours.toFixed(1)}h`}
              trend="up"
              accent="#3B82F6"
            />
            <MetricCard
              icon={GitPullRequest}
              label="Change Requests"
              value={String(changeRequestCount)}
              accent="#A855F7"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="glass rounded-[20px] p-5">
              <SectionHeader
                eyebrow="Queue"
                title={`Tickets (${enriched.length})`}
                description="Sorted by SLA urgency. Click a row to drill into ticket detail."
                action={<NewButton label="New ticket" onClick={openCreate} />}
              />
              {sel.count > 0 ? (
                <div className="mb-3">
                  <BulkActionBar
                    count={sel.count}
                    noun="ticket"
                    onClear={sel.clear}
                    actions={[
                      {
                        label: "Delete",
                        icon: Trash2,
                        tone: "danger",
                        onClick: () =>
                          bulkDeleteWithUndo({
                            ids: sel.selectedIds,
                            items: storeTickets,
                            remove: removeTicket,
                            restore: restoreTicket,
                            toast,
                            noun: "ticket",
                            onDone: sel.clear,
                          }),
                      },
                      {
                        label: "Mark Resolved",
                        onClick: () => {
                          [...sel.selectedIds].forEach((id) => updateTicket(id, { status: "Resolved" }));
                          sel.clear();
                        },
                      },
                    ]}
                  />
                </div>
              ) : null}
              <TicketQueue
                rows={enriched}
                onRowClick={(t) => setDrillId(t.id)}
                selection={sel}
                onUpdate={updateTicket}
              />
            </div>
            <div className="glass rounded-[20px] p-5">
              <SectionHeader eyebrow="SLA radar" title="Deadlines at risk" />
              <SLARiskPanel tickets={enriched} />
            </div>
          </div>
        </>
      )}

      <TicketFormDialog
        open={formOpen}
        editing={editing}
        initialTitle={prefillTitle}
        onClose={() => {
          setFormOpen(false);
          setPrefillTitle(undefined);
        }}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateTicket(editingId, draft);
            toast.success("Ticket updated", draft.title);
          } else {
            addTicket(draft);
            toast.success("Ticket created", draft.title);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Close & remove ticket?"
        description={
          confirmDelete
            ? `${confirmDelete.code} · ${confirmDelete.title} will be removed from the queue. SLA history stays for reporting.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const code = confirmDelete.code;
          removeTicket(confirmDelete.id);
          setConfirmDelete(null);
          setDrillId(null);
          toast.info("Ticket removed", `${code} has been archived.`);
        }}
      />
    </div>
  );
}
