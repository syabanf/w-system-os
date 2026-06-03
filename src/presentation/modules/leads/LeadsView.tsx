"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Flame, Pencil, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { createLeadService } from "@/application/factories/createLeadService";
import type {
  LeadInsightsDTO,
  LeadInsight,
} from "@/application/use-cases/leads/GetLeadInsights";
import type { Lead } from "@/domain/entities/Lead";
import { LEAD_STAGES, type LeadStage } from "@/domain/entities/Lead";
import type { LeadQualification } from "@/domain/entities/LeadSource";
import { QUALIFICATION_ORDER } from "@/domain/entities/LeadSource";
import { useLeadsStore } from "@/state/leads.store";
import { useCommandIntentStore } from "@/state/commandIntent.store";
import { useToast } from "@/state/toast.store";
import { useHotkey } from "@/hooks/useHotkey";
import { LeadFormDialog } from "./LeadFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { NewButton } from "@/presentation/shared/NewButton";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { BulkActionBar } from "@/presentation/shared/BulkActionBar";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { useRowSelection } from "@/hooks/useRowSelection";
import { Avatar } from "@/presentation/shared/Avatar";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { relativeFromNow } from "@/lib/date";
import { SourcePerformanceChart } from "./SourcePerformanceChart";
import { ProjectCommercialPanel } from "./ProjectCommercialPanel";
import { LeadDetailView } from "./LeadDetailView";
import { CRMView } from "@/presentation/modules/crm/CRMView";
import { type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { DrillHeader } from "@/presentation/shared/DrillHeader";
import { DrillCue } from "@/presentation/shared/DrillCue";
import { useDrillState } from "@/state/drill.store";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { cn } from "@/lib/cn";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

const QUALIFICATION_TONE: Record<LeadQualification, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Cold: "neutral",
  Warm: "info",
  Hot: "warning",
  MQL: "wit",
  SQL: "success",
};

const STAGE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  "New Lead": "neutral",
  Qualified: "info",
  Discovery: "info",
  "Proposal Sent": "wit",
  Negotiation: "warning",
  Won: "success",
  Lost: "danger",
};

const NOW = new Date("2026-05-19T09:00:00Z");

/** Mirrors the same derivation the GetLeadInsights use case performs, so
 *  newly-added/edited leads from the store get the same qualification/score
 *  treatment as the seed data. */
function deriveInsight(lead: Lead): LeadInsight {
  const qualification: LeadQualification =
    lead.stage === "Won" || lead.stage === "Negotiation"
      ? "SQL"
      : lead.stage === "Proposal Sent"
        ? "MQL"
        : lead.probability >= 50
          ? "Hot"
          : lead.probability >= 30
            ? "Warm"
            : "Cold";

  let score = lead.probability;
  if (lead.dealValue > 1_000_000_000) score += 10;
  const nameLc = lead.companyName.toLowerCase();
  if (nameLc.includes("bank") || nameLc.includes("fin") || nameLc.includes("health")) score += 8;
  if (lead.source === "Referral" || lead.source === "Partner") score += 8;

  const ageDays = Math.max(
    0,
    Math.floor((NOW.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    ...lead,
    qualification,
    score: Math.max(0, Math.min(100, Math.round(score))),
    ageDays,
    ownerName: "Citra Anggraini",
  };
}

export function LeadsView() {
  const [data, setData] = useState<LeadInsightsDTO | null>(null);
  const [query, setQuery] = useState("");
  const [filterQual, setFilterQual] = useState<LeadQualification | "all">("all");
  const [tab, setTab] = useState<"pipeline" | "kanban" | "commercial">("pipeline");
  const [drillId, setDrillId] = useDrillState("leads");

  // CRUD layer: store is the source of truth for the lead list; the use-case
  // run still provides static context (source metrics, scoring rules, activity
  // log) that's slow-moving and not affected by individual lead edits.
  const storeLeads = useLeadsStore((s) => s.items);
  const hydrate = useLeadsStore((s) => s.hydrate);
  const addLead = useLeadsStore((s) => s.add);
  const updateLead = useLeadsStore((s) => s.update);
  const removeLead = useLeadsStore((s) => s.remove);
  const sel = useRowSelection();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [prefillName, setPrefillName] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);

  // Reddie / command-surface intent: open the create form (optionally prefilled).
  const intent = useCommandIntentStore((s) => s.intent);
  const clearIntent = useCommandIntentStore((s) => s.clear);
  useEffect(() => {
    if (intent?.module === "leads" && intent.action === "create") {
      setEditing(null);
      setPrefillName(intent.prefill);
      setFormOpen(true);
      clearIntent();
    }
  }, [intent, clearIntent]);

  useEffect(() => {
    hydrate();
    let cancelled = false;
    (async () => {
      const insights = await createLeadService().getInsights();
      if (!cancelled) setData(insights);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const liveLeads: LeadInsight[] = useMemo(
    () => storeLeads.map(deriveInsight),
    [storeLeads],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveLeads.filter((l) => {
      if (filterQual !== "all" && l.qualification !== filterQual) return false;
      if (!q) return true;
      return (
        l.companyName.toLowerCase().includes(q) ||
        l.contactPerson.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q)
      );
    });
  }, [liveLeads, query, filterQual]);

  // ⌘N / Ctrl-N → quick "add lead". MUST be declared before any early return
  // so the hook order stays stable across "loading skeleton" and "loaded" renders.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    setEditing(null);
    setPrefillName(undefined);
    setFormOpen(true);
  });

  if (!data) return <SkeletonLoadingView />;

  const drillLead = drillId ? liveLeads.find((l) => l.id === drillId) ?? null : null;

  const openCreate = () => {
    setEditing(null);
    setPrefillName(undefined);
    setFormOpen(true);
  };
  const openEdit = (l: Lead) => {
    setEditing(l);
    setPrefillName(undefined);
    setFormOpen(true);
  };
  const crumbs: Crumb[] = drillLead
    ? [
        { id: "pipeline", label: "Pipeline" },
        { id: drillLead.id, label: drillLead.companyName },
      ]
    : [{ id: "pipeline", label: "Pipeline" }];

  const columns: Column<LeadInsight>[] = [
    {
      key: "company",
      header: "Lead",
      render: (l) => (
        <div>
          <div className="text-xs font-semibold text-zinc-100">{l.companyName}</div>
          <div className="text-[10px] text-zinc-400">{l.contactPerson} · {l.contactEmail}</div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (l) => <span className="text-[11px] text-zinc-300">{l.source}</span>,
    },
    {
      key: "qual",
      header: "Qualification",
      render: (l) => (
        <StatusBadge tone={QUALIFICATION_TONE[l.qualification]} dot>
          {l.qualification}
        </StatusBadge>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-2">
          <div className="relative h-1 w-12 overflow-hidden rounded-full bg-white/8">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${l.score}%`,
                background:
                  l.score >= 70
                    ? "linear-gradient(90deg, #34D399, #FBBF24)"
                    : l.score >= 40
                      ? "#FBBF24"
                      : "#A1A1AA",
              }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-zinc-200">{l.score}</span>
        </div>
      ),
    },
    {
      key: "value",
      header: "Deal value",
      align: "right",
      render: (l) => (
        <EditableCell
          value={l.dealValue}
          type="currencyCompact"
          onSave={(v) => updateLead(l.id, { dealValue: v as number })}
          displayClassName="font-mono text-xs text-zinc-200"
        />
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (l) => (
        <EditableCell
          value={l.stage}
          type="select"
          options={LEAD_STAGES}
          onSave={(v) => updateLead(l.id, { stage: v as LeadStage })}
        />
      ),
    },
    {
      key: "age",
      header: "Age",
      align: "right",
      render: (l) => <span className="text-[11px] text-zinc-400">{l.ageDays}d</span>,
    },
    {
      key: "follow",
      header: "Follow-up",
      render: (l) => <span className="text-[11px] text-zinc-300">{l.followUpDate}</span>,
    },
    {
      key: "open",
      header: "",
      align: "right",
      render: (l) => (
        <span
          className="group inline-flex justify-end"
          role="button"
          aria-label={`Open ${l.companyName}`}
        >
          <DrillCue label="Open" />
        </span>
      ),
    },
  ];

  // Live aggregates from the store so metric cards stay accurate after CRUD.
  const liveQualCounts = liveLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.qualification] = (acc[l.qualification] ?? 0) + 1;
    return acc;
  }, {});
  const livePipelineValue = liveLeads
    .filter((l) => l.stage !== "Lost" && l.stage !== "Won")
    .reduce((s, l) => s + l.dealValue, 0);
  const liveWeightedValue = liveLeads
    .filter((l) => l.stage !== "Lost" && l.stage !== "Won")
    .reduce((s, l) => s + (l.dealValue * l.probability) / 100, 0);
  const liveHotCount = liveLeads.filter((l) => l.qualification === "Hot").length;
  const liveQualifiedCount =
    (liveQualCounts.MQL ?? 0) + (liveQualCounts.SQL ?? 0);
  const liveAvgScore =
    liveLeads.length > 0
      ? liveLeads.reduce((s, l) => s + l.score, 0) / liveLeads.length
      : 0;
  const liveConversion =
    liveLeads.length > 0
      ? (liveLeads.filter((l) => l.stage === "Won").length / liveLeads.length) * 100
      : 0;
  const totalQualified = QUALIFICATION_ORDER.reduce(
    (s, q) => s + (liveQualCounts[q] ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Growth · Leads
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Pipeline & qualification
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Inbound and outbound leads scored, qualified, and ready to convert. Source attribution
            and conversion benchmarks per channel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LeadsTabSwitch tab={tab} onChange={setTab} />
          {tab === "pipeline" ? (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search leads…"
              className="w-full sm:w-auto md:w-72"
            />
          ) : null}
          {tab === "pipeline" && !drillLead ? (
            <NewButton label="New lead" onClick={openCreate} />
          ) : null}
          {drillLead ? (
            <>
              <button
                type="button"
                onClick={() => openEdit(drillLead)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(drillLead)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          ) : null}
          <ManageMasterDataButton moduleId="leads" />
        </div>
      </header>

      {tab === "commercial" ? (
        <ProjectCommercialPanel />
      ) : tab === "kanban" ? (
        <CRMView compact />
      ) : drillLead ? (
        <>
          <DrillHeader
            crumbs={crumbs}
            onJump={(i) => i === 0 && setDrillId(null)}
            onBack={() => setDrillId(null)}
            backLabel="Back to leads"
            ariaLabel="Lead drill-down"
          />
          <LeadDetailView lead={drillLead} />
        </>
      ) : (
      <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={TrendingUp}
          label="Pipeline Value"
          value={formatIDRCompact(livePipelineValue)}
          delta={`${formatIDRCompact(liveWeightedValue)} weighted`}
          trend="up"
        />
        <MetricCard
          icon={Flame}
          label="Hot Leads"
          value={String(liveHotCount)}
          delta={`${liveQualifiedCount} qualified`}
          accent="#FF8A92"
        />
        <MetricCard
          icon={Sparkles}
          label="Avg Lead Score"
          value={liveAvgScore.toFixed(0)}
          delta={`max 100`}
          accent="#3B82F6"
        />
        <MetricCard
          icon={Activity}
          label="Conversion Rate"
          value={formatPercent(liveConversion, 0)}
          trend="up"
          accent="#22C55E"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Source performance"
          description="Pipeline value (left) and channel conversion rate (right) per source."
          height={260}
        >
          <SourcePerformanceChart rows={data.sourceMetrics} />
        </ChartCard>

        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Funnel"
            title="Qualification stages"
            description="Where leads sit on the qualification ladder."
          />
          <ul className="space-y-1.5">
            {QUALIFICATION_ORDER.map((q) => {
              const count = liveQualCounts[q] ?? 0;
              const pct = totalQualified > 0 ? (count / totalQualified) * 100 : 0;
              return (
                <li
                  key={q}
                  onClick={() => setFilterQual(filterQual === q ? "all" : q)}
                  className="grid cursor-pointer grid-cols-12 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <div className="col-span-3 text-[11px] font-semibold text-zinc-100">{q}</div>
                  <div className="col-span-7 relative h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          q === "SQL"
                            ? "linear-gradient(90deg,#22C55E,#FBBF24)"
                            : q === "MQL"
                              ? "linear-gradient(90deg,#FBBF24,#FF8A92)"
                              : q === "Hot"
                                ? "#FBBF24"
                                : q === "Warm"
                                  ? "#60A5FA"
                                  : "#A1A1AA",
                      }}
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono text-[10px] text-zinc-300">
                    {count}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-500">
            {filterQual === "all" ? "Click a stage to filter" : `Filtering · ${filterQual}`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-[20px] p-5 xl:col-span-2">
          <SectionHeader
            eyebrow="Records"
            title={`Leads (${filtered.length})`}
            description="Sorted by score. Click a row to drill into deal detail + activity log."
            action={
              filterQual !== "all" ? (
                <button
                  onClick={() => setFilterQual("all")}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-200 hover:bg-white/15"
                >
                  Clear filter
                </button>
              ) : null
            }
          />
          <BulkActionBar
            count={sel.count}
            noun="lead"
            onClear={sel.clear}
            actions={[
              {
                label: "Delete",
                icon: Trash2,
                tone: "danger",
                onClick: () => {
                  [...sel.selectedIds].forEach((id) => removeLead(id));
                  sel.clear();
                },
              },
              {
                label: "Mark Lost",
                onClick: () => {
                  [...sel.selectedIds].forEach((id) => updateLead(id, { stage: "Lost" }));
                  sel.clear();
                },
              },
            ]}
          />
          <DataTable<LeadInsight>
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={(l) => setDrillId(l.id)}
            selectable
            selectedIds={sel.selectedIds}
            onToggleRow={sel.toggle}
            onToggleAll={sel.toggleAll}
            dense
          />
        </div>
        <div className="space-y-4">
          <div className="glass rounded-[20px] p-5">
            <SectionHeader eyebrow="Recent" title="Lead activity" />
            <ul className="space-y-2">
              {data.recentActivities.map((a) => {
                const actor = teamMap.get(a.actorId);
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
                  >
                    {actor ? (
                      <Avatar name={actor.name} initials={actor.initials} color={actor.avatarColor} size="sm" />
                    ) : (
                      <span className="h-7 w-7" />
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-200">
                        <span className="font-semibold text-zinc-50">{a.type}</span>{" "}
                        <span className="text-zinc-400">— {a.leadName}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{a.subject} · {relativeFromNow(a.at)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="glass rounded-[20px] p-5">
            <SectionHeader eyebrow="Engine" title="Scoring rules" description="Currently weighting lead scores." />
            <ul className="space-y-1.5">
              {data.scoringRules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[11px] text-zinc-100">{rule.description}</div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">{rule.category}</div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[11px] ${
                      rule.points >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {rule.points > 0 ? "+" : ""}{rule.points}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      </>
      )}

      <LeadFormDialog
        open={formOpen}
        editing={editing}
        initialName={prefillName}
        onClose={() => {
          setFormOpen(false);
          setPrefillName(undefined);
        }}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateLead(editingId, draft);
            toast.success("Lead updated", draft.companyName);
          } else {
            addLead(draft);
            toast.success("Lead added", `${draft.companyName} entered the pipeline`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Remove lead?"
        description={
          confirmDelete
            ? `${confirmDelete.companyName} will be removed from the pipeline. Activities linked to this lead remain in history.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = confirmDelete.companyName;
          removeLead(confirmDelete.id);
          setConfirmDelete(null);
          setDrillId(null);
          toast.info("Lead removed", `${name} has been archived.`);
        }}
      />
    </div>
  );
}

type LeadsTab = "pipeline" | "kanban" | "commercial";
function LeadsTabSwitch({
  tab,
  onChange,
}: {
  tab: LeadsTab;
  onChange: (t: LeadsTab) => void;
}) {
  const opts: { id: LeadsTab; label: string }[] = [
    { id: "pipeline", label: "Leads & Scoring" },
    { id: "kanban", label: "Sales Kanban" },
    { id: "commercial", label: "Project Commercial" },
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
