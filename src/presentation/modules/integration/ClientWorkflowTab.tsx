"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  LayoutGrid,
  Layers,
  Pencil,
  Plus,
  Table2,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockKnowledge } from "@/infrastructure/data/knowledge.mock";
import type { Client } from "@/domain/entities/Client";
import type { Project } from "@/domain/entities/Project";
import { Avatar } from "@/presentation/shared/Avatar";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { DrillHeader } from "@/presentation/shared/DrillHeader";
import { useToast } from "@/state/toast.store";
import { useClientsStore } from "@/state/clients.store";
import { useDrillState } from "@/state/drill.store";
import { useIntegrationFilterStore } from "@/state/integrationFilter.store";
import { cn } from "@/lib/cn";
import { formatIDRCompact } from "@/lib/currency";
import { ClientFormDialog } from "@/presentation/modules/clients/ClientFormDialog";
import { ProjectMilestoneTracker } from "@/presentation/modules/projects/ProjectMilestoneTracker";
import { ProjectMilestoneTable } from "@/presentation/modules/projects/ProjectMilestoneTable";
import { PastelKPITile } from "./PastelKPITile";
import { MilestoneCalendar } from "./MilestoneCalendar";
import { InvoiceMiniList } from "./InvoiceMiniList";

const PAGE_SIZE = 7;

interface ClientWorkflowTabProps {
  /** Override the client source — pass store items when used inside the Clients
   *  module so newly-added clients appear immediately. Falls back to the static
   *  `mockClients` seed when omitted (Integration Dashboard demo path). */
  clients?: Client[];
  /** Show an "Add client" CTA in the table toolbar that calls this handler. */
  onAddClient?: () => void;
  /** Wire the pencil action in each row. Without this it just toasts "Edit triggered". */
  onEditClient?: (c: Client) => void;
  /** Wire the trash action in each row. Without this it just warns "Delete demo". */
  onDeleteClient?: (c: Client) => void;
  /** Suppress the cyan filter chip (used by the Integration Dashboard module
   *  but not when this view drives the standalone Clients module). */
  hideFilterChip?: boolean;
}

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "excellent", label: "Excellent" },
  { id: "stable", label: "Stable" },
  { id: "at-risk", label: "At risk" },
  { id: "churn-risk", label: "Churn risk" },
];

type DrillView = "board" | "table" | "calendar" | "invoices";

/** View-mode segmented control options for the project data step. */
const DATA_VIEW_MODES: ReadonlyArray<{
  id: Extract<DrillView, "board" | "table" | "calendar">;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "table", label: "Table", icon: Table2 },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

const FILTER_TASK_OPTIONS = [
  { id: "invoices" as const, label: "Invoice List" },
  { id: "tasks" as const, label: "Task List" },
  { id: "dev-doc" as const, label: "Development Document" },
  { id: "demo" as const, label: "Demo Link" },
];

/** Health → status-dot colour for project chips in the drill view. */
const PROJECT_HEALTH_DOT: Record<Project["health"], string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red: "bg-rose-400",
};

function teamName(id: string | undefined): string {
  if (!id) return "—";
  return mockTeam.find((t) => t.id === id)?.name ?? "—";
}

/** Trigger a client-side download of arbitrary JSON without a backend. */
function downloadJSON(filename: string, data: unknown): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ClientWorkflowTab({
  clients: clientsProp,
  onAddClient,
  onEditClient,
  onDeleteClient,
  hideFilterChip = false,
}: ClientWorkflowTabProps = {}) {
  const toast = useToast();
  const filterCategory = useIntegrationFilterStore((s) => s.category);
  const clearFilter = useIntegrationFilterStore((s) => s.clear);

  // Source of truth: store-injected list (Clients module) or static mock
  // (Integration Dashboard demo).
  const clientsSource = clientsProp ?? mockClients;

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [drillView, setDrillView] = useState<DrillView>("board");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // KPI counts (live from source).
  const companyCount = clientsSource.length;
  const clientCount = clientsSource.length;
  const projectCount = mockProjects.length;
  // No projects use "Cancelled" status in mock; PDF shows the tile anyway.
  const cancelCount =
    mockProjects.filter((p) => p.status === "Delivered").length || 100;

  const topViewed = useMemo(
    () => [...mockKnowledge].sort((a, b) => b.readMinutes - a.readMinutes).slice(0, 3),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clientsSource.filter((c) => {
      if (status !== "all" && c.health !== status) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.primaryContact.toLowerCase().includes(q)
      );
    });
  }, [clientsSource, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const drillClient = drillId
    ? clientsSource.find((c) => c.id === drillId) ?? null
    : null;
  // A client owns MANY projects — collect them all so the drill view can list
  // and switch between them (Client → Projects → Milestones hierarchy).
  const drillClientProjects = drillClient
    ? mockProjects.filter((p) => p.clientId === drillClient.id)
    : [];

  if (drillClient) {
    // Master-detail: keep the client list visible in a left sidebar (PDF
    // pages 5–6 pattern) while the selected client's detail renders on the
    // right. Selecting another row swaps the detail in place.
    return (
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <ClientSidebarList
          clients={filtered}
          activeId={drillClient.id}
          query={query}
          onQueryChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          onSelect={(id) => {
            setDrillId(id);
            setDrillView("board");
            setFilterMenuOpen(false);
          }}
          onAddClient={onAddClient}
        />
        <DrillView
          key={drillClient.id}
          client={drillClient}
          projects={drillClientProjects}
          view={drillView}
          onChangeView={setDrillView}
          filterMenuOpen={filterMenuOpen}
          onToggleFilterMenu={() => setFilterMenuOpen((v) => !v)}
          onCloseFilterMenu={() => setFilterMenuOpen(false)}
          onBack={() => {
            setDrillId(null);
            setDrillView("board");
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {filterCategory && !hideFilterChip ? (
        <div className="flex items-center gap-2">
          <span className="glass-soft inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-200">
            <Filter className="h-3 w-3" />
            Filtered by: <span className="font-semibold capitalize">{filterCategory.replace("-", " ")}</span>
            <button
              type="button"
              onClick={() => {
                clearFilter();
                toast.info("Filter cleared");
              }}
              aria-label="Clear filter"
              className="ml-1 grid h-4 w-4 place-items-center rounded-full hover:bg-cyan-400/20"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <PastelKPITile tone="cream" value={String(companyCount)} label="Company" style={{ "--stagger-index": 0 } as React.CSSProperties} />
        <PastelKPITile tone="mint" value={String(clientCount)} label="Client" style={{ "--stagger-index": 1 } as React.CSSProperties} />
        <PastelKPITile tone="blue" value={String(projectCount)} label="Project" style={{ "--stagger-index": 2 } as React.CSSProperties} />
        <PastelKPITile tone="lilac" value={String(cancelCount)} label="Cancel" style={{ "--stagger-index": 3 } as React.CSSProperties} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="glass rounded-[20px] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Most View Product
          </div>
          <ul className="mt-3 space-y-2">
            {topViewed.map((k) => (
              <li
                key={k.id}
                className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <div className="truncate text-xs font-semibold text-zinc-100">
                  {k.title}
                </div>
                <div className="mt-1 text-[10px] text-zinc-400">
                  {k.readMinutes * 14} View · {Math.max(2, Math.round(k.readMinutes * 2.2))} Download
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className="glass rounded-[20px] p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Client Data
              </div>
              <div className="text-sm font-semibold text-zinc-50">
                All clients
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPage(0);
                }}
                placeholder="Search clients…"
                className="w-56"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-white/25"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {onAddClient ? (
                <button
                  type="button"
                  onClick={onAddClient}
                  className="press inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 hover:bg-white"
                >
                  <Plus className="h-3 w-3" />
                  Add client
                </button>
              ) : null}
            </div>
          </header>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  <Th>Product</Th>
                  <Th>Last updates</Th>
                  <Th>Created</Th>
                  <Th>PIC</Th>
                  <Th>Category</Th>
                  <Th className="text-center">Ver</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-xs text-zinc-400">
                      No clients match the current filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setDrillId(c.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${c.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDrillId(c.id);
                        }
                      }}
                      className="animate-fade-in cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:bg-white/[0.06]"
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={c.name}
                            color={c.logoColor}
                            size="sm"
                          />
                          <span className="truncate text-xs font-semibold text-zinc-100">
                            {c.name}
                          </span>
                        </div>
                      </Td>
                      <Td className="text-[11px] text-zinc-300">
                        {formatDate(c.renewalDate)}
                      </Td>
                      <Td className="text-[11px] text-zinc-300">
                        {formatDate(c.joinedAt)}
                      </Td>
                      <Td className="text-[11px] text-zinc-200">
                        {teamName(c.accountOwnerId)}
                      </Td>
                      <Td className="text-[11px] text-zinc-300">
                        {c.industry}
                      </Td>
                      <Td className="text-center font-mono text-[11px] text-zinc-300">
                        2
                      </Td>
                      <Td className="text-right">
                        <div
                          className="inline-flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowAction
                            label={`View ${c.name}`}
                            icon={Eye}
                            tone="default"
                            onClick={() => setDrillId(c.id)}
                          />
                          <RowAction
                            label={`Edit ${c.name}`}
                            icon={Pencil}
                            tone="default"
                            onClick={() =>
                              onEditClient
                                ? onEditClient(c)
                                : toast.info("Edit triggered", c.name)
                            }
                          />
                          <RowAction
                            label={`Delete ${c.name}`}
                            icon={Trash2}
                            tone="danger"
                            onClick={() =>
                              onDeleteClient
                                ? onDeleteClient(c)
                                : toast.warning("Delete demo", `${c.name} (no-op)`)
                            }
                          />
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-zinc-400">
              Showing {pageRows.length} of {filtered.length} Results
            </div>
            <div className="flex items-center gap-1">
              <PageChip
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
                Prev
              </PageChip>
              {Array.from({ length: pageCount }).map((_, i) => (
                <PageChip
                  key={i}
                  active={i === safePage}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </PageChip>
              ))}
              <PageChip
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </PageChip>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

interface DrillViewProps {
  client: Client;
  /** Every project owned by this client — a client has many. */
  projects: Project[];
  view: DrillView;
  onChangeView: (v: DrillView) => void;
  filterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
  onCloseFilterMenu: () => void;
  onBack: () => void;
}

function DrillView({
  client,
  projects,
  view,
  onChangeView,
  filterMenuOpen,
  onToggleFilterMenu,
  onCloseFilterMenu,
  onBack,
}: DrillViewProps) {
  const toast = useToast();
  const owner = teamName(client.accountOwnerId);
  const updateClient = useClientsStore((s) => s.update);

  // Step-by-step drill: Clients → Projects → Data.
  // `selectedProjectId === null` means we're on the PROJECTS step (list all
  // projects for this client). Picking one advances to the DATA step (the
  // milestone tracker / calendar / invoices). Persisted per client so
  // returning to a client restores the open project across reloads.
  const [selectedProjectId, setSelectedProjectId] = useDrillState(
    `client.${client.id}`,
  );
  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  // Header action state: inline detail strip, edit dialog, "Action View" menu.
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // The "Filter Task" and "Action View" menus must be mutually exclusive and
  // dismiss on an outside click (previously both could be open at once and only
  // closed on mouse-leave).
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterMenuOpen && !actionMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (
        filterMenuRef.current?.contains(t) ||
        actionMenuRef.current?.contains(t)
      ) {
        return;
      }
      onCloseFilterMenu();
      setActionMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [filterMenuOpen, actionMenuOpen, onCloseFilterMenu]);

  const exportDossier = () => {
    downloadJSON(`${client.name.replace(/\s+/g, "-").toLowerCase()}-dossier.json`, {
      client,
      projects,
      exportedAt: new Date().toISOString(),
    });
    toast.success("Dossier exported", `${client.name} · ${projects.length} projects`);
  };

  return (
    <div className="animate-slide-in-right space-y-4">
      <DrillHeader
        crumbs={[
          { id: "mgmt", label: "Management" },
          { id: "client", label: "Client Data" },
          {
            id: client.id,
            label: client.name,
            sublabel: `${projects.length} ${projects.length === 1 ? "project" : "projects"}`,
          },
          ...(selectedProject
            ? [{ id: selectedProject.id, label: selectedProject.name }]
            : []),
        ]}
        onJump={(level) => {
          // 0=Management, 1=Client Data → all-clients list.
          // 2=client name → PROJECTS step (clear the selected project).
          if (level < 2) {
            onBack();
          } else if (level === 2) {
            setSelectedProjectId(null);
            onCloseFilterMenu();
          }
        }}
        onBack={() => {
          // On the DATA step, step back to PROJECTS; on the PROJECTS step,
          // step back out to the all-clients list. (Also bound to Esc / ⌘[.)
          if (selectedProject) {
            setSelectedProjectId(null);
            onCloseFilterMenu();
          } else {
            onBack();
          }
        }}
        backLabel={selectedProject ? "Back to projects" : "Back to clients"}
        ariaLabel="Client drill-down"
      />

      <div className="glass flex flex-wrap items-center gap-3 rounded-[20px] p-4">
        <Avatar name={client.name} color={client.logoColor} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {client.industry}
          </div>
          <div className="truncate text-base font-semibold text-zinc-50">
            {client.name}
          </div>
          <div className="text-[11px] text-zinc-400">
            PIC · {owner} · {projects.length}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDetailOpen((o) => !o)}
            aria-expanded={detailOpen}
            className={cn(
              "press rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
              detailOpen
                ? "bg-white/15 text-zinc-50"
                : "bg-white/5 text-zinc-200 hover:bg-white/10",
            )}
          >
            Detail
          </button>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="press rounded-full bg-[#2563EB] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={exportDossier}
            className="press inline-flex items-center gap-1 rounded-full bg-[#10B981] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#059669]"
          >
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>

      {detailOpen ? (
        <div className="animate-fade-in-up glass grid grid-cols-2 gap-x-6 gap-y-3 rounded-[20px] p-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailStat label="Health" value={client.health} />
          <DetailStat label="Region" value={client.region} />
          <DetailStat label="Account owner" value={owner} />
          <DetailStat
            label="Contract value"
            value={formatIDRCompact(client.contractValue)}
          />
          <DetailStat label="Contact" value={client.primaryContact} />
          <DetailStat label="Email" value={client.contactEmail} />
          <DetailStat label="Renews" value={formatDate(client.renewalDate)} />
          <DetailStat
            label="Retainer"
            value={client.retainerActive ? "Active" : "—"}
          />
        </div>
      ) : null}

      <ClientFormDialog
        open={editOpen}
        editing={client}
        onClose={() => setEditOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateClient(editingId, draft);
            toast.success("Client updated", draft.name);
          }
        }}
      />

      {projects.length === 0 ? (
        <div className="glass rounded-[20px] p-8 text-center text-sm text-zinc-400">
          No projects linked to this client yet.
        </div>
      ) : !selectedProject ? (
        /* ── STEP 2 · PROJECTS ─────────────────────────────────────────────
           All projects owned by this client. Pick one to drill into its
           data (milestones / calendar / invoices). */
        <div className="animate-fade-in-up space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            <Layers className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
              Projects · {projects.length}
            </span>
            <span className="text-[11px] text-zinc-500">
              — select a project to view all its data
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`View all data for ${p.name}`}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  onChangeView("board");
                  onCloseFilterMenu();
                }}
                style={{ "--stagger-index": i } as React.CSSProperties}
                className="press hover-lift stagger-item group glass-soft flex flex-col gap-3 rounded-2xl border border-white/8 p-4 text-left hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        PROJECT_HEALTH_DOT[p.health],
                      )}
                    />
                    <span className="truncate text-sm font-semibold text-zinc-50">
                      {p.name}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-300">
                    {p.status}
                  </span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {p.code}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Progress</span>
                    <span className="font-mono text-zinc-300">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-emerald-400/80"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    {formatIDRCompact(p.budget)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {p.teamIds.length}
                  </span>
                  <span className="truncate">PM · {teamName(p.projectManagerId)}</span>
                </div>
                <div className="mt-auto flex items-center gap-1 pt-1 text-[11px] font-semibold text-[#2563EB]">
                  View all data
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── STEP 3 · DATA ─────────────────────────────────────────────────
           The selected project's full data: milestone tracker, calendar or
           invoices. */
        <>
          <div className="glass-soft flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 px-4 py-3">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                PROJECT_HEALTH_DOT[selectedProject.health],
              )}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-50">
                {selectedProject.name}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {selectedProject.code} · {selectedProject.status} · {selectedProject.progress}%
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedProjectId(null);
                onCloseFilterMenu();
              }}
              className="press ml-auto inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10"
            >
              <Layers className="h-3 w-3" />
              All projects
            </button>
          </div>

          <div className="glass-soft flex flex-wrap items-center gap-2 rounded-full border border-white/8 px-3 py-2">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Project Filter
            </span>
            {/* View-mode switch: Board · Table · Calendar */}
            <div className="inline-flex rounded-full bg-white/5 p-0.5">
              {DATA_VIEW_MODES.map((mode) => {
                const active = view === mode.id;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onChangeView(mode.id)}
                    aria-pressed={active}
                    className={cn(
                      "press inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                      active
                        ? "bg-white/15 text-zinc-50"
                        : "text-zinc-300 hover:bg-white/8 hover:text-zinc-50",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
            <div className="relative" ref={filterMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setActionMenuOpen(false);
                  onToggleFilterMenu();
                }}
                aria-expanded={filterMenuOpen}
                className="press inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
              >
                <Filter className="h-3 w-3" />
                Filter Task
                <ChevronDown className={cn("h-3 w-3 transition-transform", filterMenuOpen && "rotate-180")} />
              </button>
              {filterMenuOpen ? (
                <div
                  role="menu"
                  className="animate-scale-in glass-strong absolute left-0 top-full z-20 mt-1 w-48 origin-top-left overflow-hidden rounded-xl border border-white/10 shadow-xl"
                >
                  {FILTER_TASK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onCloseFilterMenu();
                        if (opt.id === "invoices") {
                          onChangeView("invoices");
                        } else {
                          onChangeView("board");
                          toast.info(opt.label, "Demo only");
                        }
                      }}
                      className="block w-full px-3 py-1.5 text-left text-[11px] text-zinc-200 hover:bg-white/8"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative ml-auto" ref={actionMenuRef}>
              <button
                type="button"
                onClick={() => {
                  onCloseFilterMenu();
                  setActionMenuOpen((o) => !o);
                }}
                aria-expanded={actionMenuOpen}
                className="press inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10"
              >
                Action View
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    actionMenuOpen && "rotate-180",
                  )}
                />
              </button>
              {actionMenuOpen ? (
                <div
                  role="menu"
                  className="animate-scale-in glass-strong absolute right-0 top-full z-20 mt-1 w-48 origin-top-right overflow-hidden rounded-xl border border-white/10 shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenuOpen(false);
                      setDetailOpen(true);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[11px] text-zinc-200 hover:bg-white/8"
                  >
                    Show client detail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenuOpen(false);
                      exportDossier();
                    }}
                    className="block w-full px-3 py-1.5 text-left text-[11px] text-zinc-200 hover:bg-white/8"
                  >
                    Export dossier (JSON)
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div key={`${selectedProject.id}-${view}`} className="animate-fade-in-up">
            {view === "calendar" ? (
              <MilestoneCalendar projectId={selectedProject.id} />
            ) : view === "invoices" ? (
              <InvoiceMiniList clientId={client.id} />
            ) : view === "table" ? (
              <ProjectMilestoneTable projectId={selectedProject.id} />
            ) : (
              <ProjectMilestoneTracker projectId={selectedProject.id} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface ClientSidebarListProps {
  clients: Client[];
  activeId: string;
  query: string;
  onQueryChange: (v: string) => void;
  onSelect: (id: string) => void;
  onAddClient?: () => void;
}

/** Compact, selectable client list shown alongside the detail pane while
 *  drilled in — the "master" column of the master-detail layout. */
function ClientSidebarList({
  clients,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onAddClient,
}: ClientSidebarListProps) {
  return (
    <aside className="glass flex flex-col rounded-[20px] p-3 lg:max-h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Clients · {clients.length}
        </div>
        {onAddClient ? (
          <button
            type="button"
            onClick={onAddClient}
            aria-label="Add client"
            title="Add client"
            className="press grid h-6 w-6 place-items-center rounded-full bg-white/85 text-zinc-900 hover:bg-white"
          >
            <Plus className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 px-1">
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder="Search clients…"
          className="w-full"
        />
      </div>

      <ul className="mt-2 flex-1 space-y-1 overflow-y-auto pr-0.5">
        {clients.length === 0 ? (
          <li className="px-2 py-6 text-center text-[11px] text-zinc-400">
            No clients match.
          </li>
        ) : (
          clients.map((c, i) => {
            const active = c.id === activeId;
            return (
              <li
                key={c.id}
                className="stagger-item"
                style={{ "--stagger-index": i } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "press flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left",
                    active
                      ? "bg-white/12 ring-1 ring-inset ring-white/15"
                      : "hover:bg-white/[0.05]",
                  )}
                >
                  <Avatar name={c.name} color={c.logoColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-xs font-semibold",
                        active ? "text-zinc-50" : "text-zinc-200",
                      )}
                    >
                      {c.name}
                    </div>
                    <div className="truncate text-[10px] text-zinc-400">
                      {c.industry}
                    </div>
                  </div>
                  {active ? (
                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-300" />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-2.5 text-zinc-200", className)}>{children}</td>;
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 truncate text-xs font-medium text-zinc-100">
        {value}
      </div>
    </div>
  );
}

interface RowActionProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "danger";
  onClick: () => void;
}

function RowAction({ label, icon: Icon, tone, onClick }: RowActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "press grid h-6 w-6 place-items-center rounded text-zinc-400 hover:scale-110",
        tone === "danger"
          ? "hover:bg-rose-500/15 hover:text-rose-300"
          : "hover:bg-white/10 hover:text-zinc-100",
      )}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}

interface PageChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

function PageChip({ children, onClick, active, disabled }: PageChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "press inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
        active
          ? "bg-white/12 text-zinc-50"
          : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-100",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  );
}
