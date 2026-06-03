"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Mail,
  Play,
  RefreshCw,
  Share2,
  XCircle,
} from "lucide-react";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { cn } from "@/lib/cn";
import {
  CATEGORY_TONE,
  TEMPLATES,
  type Category,
  type ReportTemplate,
  type RunHistoryItem,
} from "./reportsData";
import { ReportDetailView } from "./ReportDetailView";
import {
  useReportRunsStore,
  useReportSchedulesStore,
} from "./reports.store";

const FORMAT_ICON: Record<ReportTemplate["format"], React.ReactNode> = {
  PDF: <FileText className="h-3 w-3" />,
  Excel: <FileSpreadsheet className="h-3 w-3" />,
  CSV: <FileSpreadsheet className="h-3 w-3" />,
};

const STATUS_ICON: Record<RunHistoryItem["status"], React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />,
  failed: <XCircle className="h-3.5 w-3.5 text-rose-300" />,
};

const CHANNEL_ICON: Record<"Email" | "Slack" | "Dashboard", React.ReactNode> = {
  Email: <Mail className="h-3 w-3" />,
  Slack: <Share2 className="h-3 w-3" />,
  Dashboard: <FileBarChart className="h-3 w-3" />,
};

const CATEGORIES: ("All" | Category)[] = [
  "All",
  "Finance",
  "Sales",
  "Projects",
  "People",
  "Operations",
  "Executive",
];

export function ReportsView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Category>("All");
  const [drillId, setDrillId] = useState<string | null>(null);

  const runs = useReportRunsStore((s) => s.items);
  const hydrateRuns = useReportRunsStore((s) => s.hydrate);
  const schedules = useReportSchedulesStore((s) => s.items);
  const hydrateSchedules = useReportSchedulesStore((s) => s.hydrate);

  useEffect(() => {
    hydrateRuns();
    hydrateSchedules();
  }, [hydrateRuns, hydrateSchedules]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (filter !== "All" && t.category !== filter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  const drillTemplate = drillId ? TEMPLATES.find((t) => t.id === drillId) ?? null : null;
  const crumbs: Crumb[] = drillTemplate
    ? [
        { id: "library", label: "Library" },
        { id: drillTemplate.id, label: drillTemplate.name, sublabel: drillTemplate.category },
      ]
    : [{ id: "library", label: "Library" }];

  const scheduledActive = schedules.filter((s) => !s.paused).length;
  const failedToday = runs.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Executive · Reports
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {drillTemplate ? "Report detail" : "Report library"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {drillTemplate
              ? "Preview, run history, and delivery cadence for this report template."
              : "Generate, schedule and deliver firm-wide reports. Every template is sourced from the same canonical mocks as the live modules."}
          </p>
        </div>
        {!drillTemplate ? (
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search reports…"
              className="w-full sm:w-auto md:w-64"
            />
          </div>
        ) : null}
      </header>

      {drillTemplate ? (
        <>
          <DrillBreadcrumb
            crumbs={crumbs}
            onJump={(i) => i === 0 && setDrillId(null)}
            ariaLabel="Report drill-down"
          />
          <ReportDetailView template={drillTemplate} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              emphasis
              icon={FileBarChart}
              label="Templates"
              value={String(TEMPLATES.length)}
              delta={`${CATEGORIES.length - 1} categories`}
              trend="up"
            />
            <MetricCard
              icon={CalendarClock}
              label="Scheduled"
              value={String(scheduledActive)}
              delta={`${schedules.length - scheduledActive} paused`}
              accent="#3B82F6"
            />
            <MetricCard
              icon={Play}
              label="Runs today"
              value={String(runs.length)}
              accent="#22C55E"
            />
            <MetricCard
              icon={XCircle}
              label="Failed today"
              value={String(failedToday)}
              trend={failedToday > 0 ? "down" : "flat"}
              accent="#EF4444"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Category</span>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
                  filter === c
                    ? "border-white/25 bg-white/12 text-zinc-50"
                    : "border-white/10 text-zinc-400 hover:bg-white/8 hover:text-zinc-200",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="glass rounded-[20px] p-5">
            <SectionHeader
              eyebrow="Library"
              title={`Templates (${filtered.length})`}
              description="Click any report to inspect its preview, runs and schedule."
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <ReportCard key={t.id} template={t} onOpen={() => setDrillId(t.id)} />
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
                No templates match your filter.
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="glass rounded-[20px] p-5 xl:col-span-2">
              <SectionHeader
                eyebrow="History"
                title={`Recent runs (${runs.length})`}
                description="Audit trail of every report execution in the last 48 hours."
              />
              <ul className="space-y-1.5">
                {runs.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="col-span-1 grid place-items-center">{STATUS_ICON[r.status]}</span>
                    <button
                      type="button"
                      onClick={() => setDrillId(r.templateId)}
                      className="col-span-4 truncate text-left text-[11px] font-semibold text-zinc-100 hover:text-white"
                    >
                      {r.templateName}
                    </button>
                    <span className="col-span-2">
                      <CategoryPill category={r.category} />
                    </span>
                    <span className="col-span-3 text-[11px] text-zinc-400">
                      {r.ranAt} · <span className="text-zinc-500">{r.ranBy}</span>
                    </span>
                    <span className="col-span-1 text-right font-mono text-[10px] text-zinc-400">
                      {r.duration}
                    </span>
                    <span className="col-span-1 text-right">
                      {r.status === "completed" ? (
                        <button
                          type="button"
                          aria-label={`Download ${r.templateName}`}
                          className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      ) : r.status === "failed" ? (
                        <button
                          type="button"
                          aria-label={`Retry ${r.templateName}`}
                          className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-[20px] p-5">
              <SectionHeader
                eyebrow="Cadence"
                title={`Scheduled (${schedules.length})`}
                description="Recurring deliveries to email and Slack."
              />
              <ul className="space-y-2">
                {schedules.map((s) => (
                  <li key={s.id} className="glass-soft rounded-xl border border-white/6 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setDrillId(s.templateId)}
                        className="truncate text-left text-xs font-semibold text-zinc-100 hover:text-white"
                      >
                        {s.templateName}
                      </button>
                      {s.paused ? (
                        <StatusBadge tone="neutral">paused</StatusBadge>
                      ) : (
                        <StatusBadge tone="success" dot>
                          live
                        </StatusBadge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400">
                      {CHANNEL_ICON[s.channel]}
                      <span className="truncate">{s.recipients.join(", ")}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{s.cadence}</span>
                      <span className="font-mono text-zinc-300">next · {s.nextRun}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({
  template,
  onOpen,
}: {
  template: ReportTemplate;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-soft group flex flex-col gap-3 rounded-2xl border border-white/8 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/20"
    >
      <header className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
          style={{
            background: `${CATEGORY_TONE[template.category]}1f`,
            color: CATEGORY_TONE[template.category],
            borderColor: `${CATEGORY_TONE[template.category]}33`,
          }}
        >
          <FileBarChart className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryPill category={template.category} />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
              {FORMAT_ICON[template.format]}
              {template.format}
            </span>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-zinc-50">{template.name}</h3>
        </div>
      </header>
      <p className="line-clamp-2 text-[11px] text-zinc-400">{template.description}</p>
      <footer className="mt-auto flex items-center justify-between gap-2 text-[10px] text-zinc-500">
        <span>
          {template.cadence}
          {template.lastRun ? <span className="ml-1.5">· last {template.lastRun}</span> : null}
        </span>
        <span className="text-zinc-400 transition-colors group-hover:text-zinc-200">
          Open →
        </span>
      </footer>
    </button>
  );
}

function CategoryPill({ category }: { category: Category }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
      style={{
        background: `${CATEGORY_TONE[category]}26`,
        color: CATEGORY_TONE[category],
      }}
    >
      {category}
    </span>
  );
}
