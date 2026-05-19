"use client";

import { useMemo } from "react";
import {
  AlertOctagon,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Hourglass,
  Loader2,
  Mail,
  Play,
  RefreshCw,
  Share2,
  Users2,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { mockInvoices } from "@/infrastructure/data/invoices.mock";
import { mockTickets } from "@/infrastructure/data/tickets.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockLeads } from "@/infrastructure/data/leads.mock";
import { mockEmployees, mockPayroll } from "@/infrastructure/data/employees.mock";
import { mockVelocityHistory } from "@/infrastructure/data/velocity.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDR, formatIDRCompact, formatPercent } from "@/lib/currency";
import {
  CATEGORY_TONE,
  RECENT_RUNS,
  SCHEDULED,
  type ReportTemplate,
  type RunHistoryItem,
} from "./reportsData";

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

export function ReportDetailView({ template }: { template: ReportTemplate }) {
  const tone = CATEGORY_TONE[template.category];
  const runs = useMemo(
    () => RECENT_RUNS.filter((r) => r.templateId === template.id),
    [template.id],
  );
  const schedule = useMemo(
    () => SCHEDULED.find((s) => s.templateId === template.id) ?? null,
    [template.id],
  );

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
            style={{ background: `${tone}1f`, color: tone, borderColor: `${tone}33` }}
          >
            <FileBarChart className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{ background: `${tone}26`, color: tone }}
              >
                {template.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                {FORMAT_ICON[template.format]}
                {template.format}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                <CalendarClock className="h-2.5 w-2.5" />
                {template.cadence}
              </span>
              {template.lastRun ? (
                <span className="text-[10px] text-zinc-500">
                  last run · {template.lastRun}
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {template.name}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-zinc-400">{template.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              <Play className="h-3 w-3" />
              Run now
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[11px] text-zinc-200 transition-colors hover:bg-white/12"
            >
              <CalendarClock className="h-3 w-3" />
              Schedule
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[11px] text-zinc-200 transition-colors hover:bg-white/12"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
      </header>

      <ReportPreview template={template} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-[20px] p-5 xl:col-span-2">
          <SectionHeader
            eyebrow="History"
            title={`Runs (${runs.length})`}
            description="Recent executions of this template."
          />
          {runs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
              This template has not been run yet.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {runs.map((r) => (
                <li
                  key={r.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
                >
                  <span className="col-span-1 grid place-items-center">
                    {STATUS_ICON[r.status]}
                  </span>
                  <span className="col-span-5 text-[11px] text-zinc-300">
                    {r.ranAt} <span className="text-zinc-500">· {r.ranBy}</span>
                  </span>
                  <span className="col-span-2 text-[11px] text-zinc-400 capitalize">
                    {r.status}
                  </span>
                  <span className="col-span-2 text-right font-mono text-[10px] text-zinc-400">
                    {r.duration}
                  </span>
                  <span className="col-span-2 text-right">
                    {r.status === "completed" ? (
                      <button
                        type="button"
                        aria-label="Download"
                        className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    ) : r.status === "failed" ? (
                      <button
                        type="button"
                        aria-label="Retry"
                        className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Cadence"
            title="Delivery schedule"
            description={schedule ? "Active recurring delivery." : "Not scheduled yet."}
          />
          {schedule ? (
            <div className="space-y-3 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Status</span>
                {schedule.paused ? (
                  <StatusBadge tone="neutral">paused</StatusBadge>
                ) : (
                  <StatusBadge tone="success" dot>
                    live
                  </StatusBadge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Cadence</span>
                <span className="text-zinc-100">{schedule.cadence}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Next run</span>
                <span className="font-mono text-zinc-100">{schedule.nextRun}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-zinc-400">Channel</span>
                <span className="inline-flex items-center gap-1 text-zinc-100">
                  {CHANNEL_ICON[schedule.channel]}
                  {schedule.channel}
                </span>
              </div>
              <div className="border-t border-white/8 pt-2">
                <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                  Recipients
                </div>
                <ul className="mt-1 space-y-0.5">
                  {schedule.recipients.map((r) => (
                    <li key={r} className="truncate text-zinc-200">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/8 p-4 text-center text-[11px] text-zinc-400">
              No recurring delivery set up.
              <div className="mt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[10px] text-zinc-200 hover:bg-white/12"
                >
                  <CalendarClock className="h-2.5 w-2.5" />
                  Add schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportPreview({ template }: { template: ReportTemplate }) {
  switch (template.id) {
    case "rep-001":
      return <PLPreview />;
    case "rep-002":
      return <CashflowPreview />;
    case "rep-003":
      return <OutstandingInvoicesPreview />;
    case "rep-004":
      return <SalesPipelinePreview />;
    case "rep-005":
      return <WinLossPreview />;
    case "rep-006":
      return <ProjectHealthPreview />;
    case "rep-007":
      return <SprintVelocityPreview />;
    case "rep-008":
      return <ResourceUtilizationPreview />;
    case "rep-009":
      return <HeadcountMovementPreview />;
    case "rep-010":
      return <PayrollPreview />;
    case "rep-011":
      return <SLAPreview />;
    case "rep-012":
      return <BoardPackPreview />;
    default:
      return null;
  }
}

function PreviewShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader eyebrow="Preview" title={title} description={description} />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function MiniTable({ rows, columns }: { rows: React.ReactNode[][]; columns: string[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/8">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-white/[0.03]">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/5">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 text-zinc-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────── per-template preview bodies ──────────── */

function PLPreview() {
  const lines = [
    { label: "Service revenue", amount: 2_180_000_000, kind: "income" },
    { label: "Recurring revenue", amount: 420_000_000, kind: "income" },
    { label: "Salaries & benefits", amount: -1_120_000_000, kind: "cost" },
    { label: "Cloud & tooling", amount: -82_500_000, kind: "cost" },
    { label: "Office & utilities", amount: -28_000_000, kind: "cost" },
    { label: "Marketing", amount: -45_000_000, kind: "cost" },
  ];
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const revenue = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);
  const cost = lines.filter((l) => l.kind === "cost").reduce((s, l) => s + l.amount, 0);
  return (
    <PreviewShell title="P&L · May 2026" description="Income statement preview from GL.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Revenue" value={formatIDRCompact(revenue)} trend="up" />
        <MetricCard label="Cost" value={formatIDRCompact(Math.abs(cost))} accent="#EF4444" />
        <MetricCard
          label="Net income"
          value={formatIDRCompact(total)}
          trend="up"
          accent="#22C55E"
        />
      </div>
      <MiniTable
        columns={["Account", "May 2026", "Apr 2026", "Δ MoM"]}
        rows={lines.map((l, i) => [
          l.label,
          <span
            key="amt"
            className={l.amount < 0 ? "font-mono text-rose-300" : "font-mono text-emerald-300"}
          >
            {l.amount < 0 ? "-" : ""}
            {formatIDR(Math.abs(l.amount))}
          </span>,
          <span key="prev" className="font-mono text-zinc-400">
            {l.amount < 0 ? "-" : ""}
            {formatIDR(Math.abs(l.amount) * (0.95 + (i % 3) * 0.02))}
          </span>,
          <span key="delta" className="font-mono text-zinc-300">
            {(i % 2 === 0 ? "+" : "-") + (3 + i) + "%"}
          </span>,
        ])}
      />
    </PreviewShell>
  );
}

function CashflowPreview() {
  const data = Array.from({ length: 13 }, (_, i) => ({
    x: `W${i + 1}`,
    y: 1_200_000_000 + Math.round(Math.sin(i / 2) * 250_000_000) + i * 30_000_000,
  }));
  const last = data[data.length - 1].y;
  const first = data[0].y;
  return (
    <PreviewShell
      title="13-week cashflow forecast"
      description="Projected ending bank balance assuming current AR/AP run-rate."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Opening" value={formatIDRCompact(first)} />
        <MetricCard
          label="Closing"
          value={formatIDRCompact(last)}
          trend={last > first ? "up" : "down"}
          accent={last > first ? "#22C55E" : "#EF4444"}
        />
        <MetricCard
          label="Net change"
          value={formatIDRCompact(last - first)}
          accent="#3B82F6"
        />
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="grad-cashflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "rgba(20,21,27,0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 10,
                padding: "4px 8px",
                color: "#fafafa",
              }}
              formatter={(v) => formatIDRCompact(Number(v))}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#FBBF24"
              strokeWidth={1.5}
              fill="url(#grad-cashflow)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PreviewShell>
  );
}

function OutstandingInvoicesPreview() {
  const outstanding = mockInvoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const total = outstanding.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdue = outstanding.filter((i) => i.status === "overdue");
  const clientMap = new Map(mockClients.map((c) => [c.id, c.name]));
  return (
    <PreviewShell
      title={`Outstanding receivables (${outstanding.length})`}
      description="Sent + overdue invoices with balance > 0."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Total outstanding" value={formatIDRCompact(total)} trend="down" />
        <MetricCard
          label="Overdue"
          value={String(overdue.length)}
          delta={formatIDRCompact(
            overdue.reduce((s, i) => s + (i.amount - i.paidAmount), 0),
          )}
          accent="#EF4444"
        />
        <MetricCard label="Avg balance" value={formatIDRCompact(total / Math.max(1, outstanding.length))} />
      </div>
      <MiniTable
        columns={["Invoice", "Client", "Issued", "Due", "Balance", "Status"]}
        rows={outstanding.slice(0, 8).map((i) => [
          <span key="no" className="font-mono">
            {i.number}
          </span>,
          clientMap.get(i.clientId) ?? "—",
          i.issueDate,
          i.dueDate,
          <span key="bal" className="font-mono text-zinc-100">
            {formatIDR(i.amount - i.paidAmount)}
          </span>,
          <StatusBadge
            key="s"
            tone={i.status === "overdue" ? "danger" : "info"}
          >
            {i.status}
          </StatusBadge>,
        ])}
      />
    </PreviewShell>
  );
}

function SalesPipelinePreview() {
  const stages = ["New Lead", "Qualified", "Discovery", "Proposal Sent", "Negotiation", "Won"] as const;
  const grouped = stages.map((s) => {
    const leads = mockLeads.filter((l) => l.stage === s);
    const total = leads.reduce((sum, l) => sum + l.dealValue, 0);
    const weighted = leads.reduce((sum, l) => sum + l.dealValue * (l.probability / 100), 0);
    return { stage: s, count: leads.length, total, weighted };
  });
  const totalPipeline = grouped.reduce((s, g) => s + g.total, 0);
  const weightedTotal = grouped.reduce((s, g) => s + g.weighted, 0);
  return (
    <PreviewShell
      title="Pipeline forecast by stage"
      description="Probability-weighted forecast for active deals."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Pipeline" value={formatIDRCompact(totalPipeline)} trend="up" />
        <MetricCard label="Weighted" value={formatIDRCompact(weightedTotal)} accent="#3B82F6" />
        <MetricCard
          label="Avg deal"
          value={formatIDRCompact(totalPipeline / Math.max(1, mockLeads.length))}
        />
      </div>
      <MiniTable
        columns={["Stage", "Deals", "Total", "Weighted"]}
        rows={grouped.map((g) => [
          g.stage,
          String(g.count),
          <span key="t" className="font-mono">
            {formatIDRCompact(g.total)}
          </span>,
          <span key="w" className="font-mono text-emerald-300">
            {formatIDRCompact(g.weighted)}
          </span>,
        ])}
      />
    </PreviewShell>
  );
}

function WinLossPreview() {
  const won = mockLeads.filter((l) => l.stage === "Won");
  const lost = mockLeads.filter((l) => l.stage === "Lost");
  const winRate = won.length / Math.max(1, won.length + lost.length);
  const sources = Array.from(new Set(mockLeads.map((l) => l.source))) as string[];
  return (
    <PreviewShell title="Win/Loss analysis" description="Closed deals broken down by source.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Win rate" value={formatPercent(winRate * 100, 0)} trend="up" accent="#22C55E" />
        <MetricCard label="Won" value={String(won.length)} accent="#22C55E" />
        <MetricCard label="Lost" value={String(lost.length)} accent="#EF4444" />
      </div>
      <MiniTable
        columns={["Source", "Won", "Lost", "Rate"]}
        rows={sources.map((s) => {
          const sourceWon = won.filter((l) => l.source === s).length;
          const sourceLost = lost.filter((l) => l.source === s).length;
          const rate = sourceWon / Math.max(1, sourceWon + sourceLost);
          return [
            s,
            String(sourceWon),
            String(sourceLost),
            <span key="r" className="font-mono">
              {formatPercent(rate * 100, 0)}
            </span>,
          ];
        })}
      />
    </PreviewShell>
  );
}

function ProjectHealthPreview() {
  const clientMap = new Map(mockClients.map((c) => [c.id, c.name]));
  const sorted = mockProjects.slice().sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 } as const;
    return order[a.health] - order[b.health];
  });
  const atRisk = mockProjects.filter((p) => p.health === "red").length;
  const avgProgress = mockProjects.reduce((s, p) => s + p.progress, 0) / mockProjects.length;
  return (
    <PreviewShell title="Project health snapshot" description="Health, progress and risk per engagement.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Active" value={String(mockProjects.length)} trend="up" />
        <MetricCard label="At risk" value={String(atRisk)} accent="#EF4444" />
        <MetricCard label="Avg progress" value={formatPercent(avgProgress, 0)} accent="#3B82F6" />
      </div>
      <MiniTable
        columns={["Project", "Client", "Status", "Progress", "Health"]}
        rows={sorted.slice(0, 8).map((p) => [
          p.name,
          clientMap.get(p.clientId) ?? "—",
          p.status,
          <span key="pr" className="font-mono">
            {p.progress}%
          </span>,
          <StatusBadge
            key="h"
            tone={p.health === "red" ? "danger" : p.health === "amber" ? "warning" : "success"}
            dot
          >
            {p.health}
          </StatusBadge>,
        ])}
      />
    </PreviewShell>
  );
}

function SprintVelocityPreview() {
  const data = mockVelocityHistory.map((v, i) => ({
    x: `S${i + 1}`,
    y: v.completed,
  }));
  const avg = mockVelocityHistory.reduce((s, v) => s + v.completed, 0) / Math.max(1, mockVelocityHistory.length);
  const last = mockVelocityHistory[mockVelocityHistory.length - 1]?.completed ?? 0;
  return (
    <PreviewShell title="Rolling sprint velocity" description="Completed story points per sprint.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Avg velocity" value={`${Math.round(avg)} pt`} trend="up" />
        <MetricCard label="Last sprint" value={`${last} pt`} accent="#22C55E" />
        <MetricCard
          label="Trend"
          value={last > avg ? "Above avg" : "Below avg"}
          trend={last > avg ? "up" : "down"}
          accent={last > avg ? "#22C55E" : "#F59E0B"}
        />
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="grad-velocity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "rgba(20,21,27,0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 10,
                padding: "4px 8px",
                color: "#fafafa",
              }}
              formatter={(v) => `${v} pt`}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#FDE68A"
              strokeWidth={1.5}
              fill="url(#grad-velocity)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PreviewShell>
  );
}

function ResourceUtilizationPreview() {
  const sorted = mockTeam
    .slice()
    .sort((a, b) => b.allocationPercent - a.allocationPercent);
  const overallocated = mockTeam.filter((m) => m.allocationPercent > 100).length;
  const avg = mockTeam.reduce((s, m) => s + m.allocationPercent, 0) / mockTeam.length;
  return (
    <PreviewShell title="Resource utilization" description="Allocation percent per team member.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Headcount" value={String(mockTeam.length)} />
        <MetricCard label="Avg util" value={formatPercent(avg, 0)} accent="#3B82F6" />
        <MetricCard
          label="Over-allocated"
          value={String(overallocated)}
          accent="#EF4444"
          trend={overallocated > 0 ? "down" : "flat"}
        />
      </div>
      <MiniTable
        columns={["Engineer", "Role", "Allocation", "Status"]}
        rows={sorted.slice(0, 8).map((m) => [
          m.name,
          m.role,
          <span key="a" className="font-mono">
            {m.allocationPercent}%
          </span>,
          <StatusBadge
            key="s"
            tone={
              m.availability === "available"
                ? "success"
                : m.availability === "busy"
                  ? "warning"
                  : "danger"
            }
            dot
          >
            {m.availability}
          </StatusBadge>,
        ])}
      />
    </PreviewShell>
  );
}

function HeadcountMovementPreview() {
  const byDept = mockEmployees.reduce<Record<string, number>>((acc, e) => {
    acc[e.department] = (acc[e.department] ?? 0) + 1;
    return acc;
  }, {});
  const depts = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
  return (
    <PreviewShell title="Headcount movement" description="End-of-period FTE per department.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          emphasis
          icon={Users2}
          label="Headcount"
          value={String(mockEmployees.length)}
          trend="up"
        />
        <MetricCard
          label="Joiners (Q)"
          value={String(mockEmployees.filter((e) => e.joinDate >= "2026-04-01").length)}
          accent="#22C55E"
        />
        <MetricCard label="Departments" value={String(depts.length)} accent="#3B82F6" />
      </div>
      <MiniTable
        columns={["Department", "FTE", "Share"]}
        rows={depts.map(([d, c]) => [
          d,
          String(c),
          <span key="sh" className="font-mono text-zinc-300">
            {formatPercent((c / mockEmployees.length) * 100, 0)}
          </span>,
        ])}
      />
    </PreviewShell>
  );
}

function PayrollPreview() {
  const empMap = new Map(mockEmployees.map((e) => [e.id, e]));
  const totalGross = mockPayroll.reduce((s, p) => s + p.gross, 0);
  const totalNet = mockPayroll.reduce((s, p) => s + p.netPay, 0);
  const totalPph = mockPayroll.reduce((s, p) => s + p.pph21, 0);
  return (
    <PreviewShell title="Payroll register · 2026-05" description="Gross-to-net by employee.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Total gross" value={formatIDRCompact(totalGross)} />
        <MetricCard label="Total net" value={formatIDRCompact(totalNet)} accent="#22C55E" />
        <MetricCard label="PPh 21" value={formatIDRCompact(totalPph)} accent="#EF4444" />
      </div>
      <MiniTable
        columns={["Employee", "Gross", "PPh 21", "BPJS", "Net"]}
        rows={mockPayroll.slice(0, 8).map((p) => {
          const emp = empMap.get(p.employeeId);
          return [
            emp ? `${emp.firstName} ${emp.lastName}` : "—",
            <span key="g" className="font-mono">
              {formatIDRCompact(p.gross)}
            </span>,
            <span key="pp" className="font-mono text-rose-300">
              -{formatIDRCompact(p.pph21)}
            </span>,
            <span key="bp" className="font-mono text-rose-300">
              -{formatIDRCompact(p.bpjsKesEmployee + p.bpjsTkEmployee)}
            </span>,
            <span key="n" className="font-mono font-semibold text-emerald-300">
              {formatIDRCompact(p.netPay)}
            </span>,
          ];
        })}
      />
    </PreviewShell>
  );
}

function SLAPreview() {
  const breached = mockTickets.filter((t) => {
    const due = new Date(t.slaDeadline).getTime();
    const now = new Date("2026-05-18T09:00:00Z").getTime();
    return due < now && t.status !== "Resolved" && t.status !== "Closed";
  });
  const bySev = ["critical", "high", "medium", "low"].map((sev) => ({
    sev,
    total: mockTickets.filter((t) => t.severity === sev).length,
    breached: breached.filter((t) => t.severity === sev).length,
  }));
  return (
    <PreviewShell title="SLA compliance" description="Breach rate by severity.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard emphasis label="Tickets" value={String(mockTickets.length)} />
        <MetricCard
          icon={AlertOctagon}
          label="Breached"
          value={String(breached.length)}
          trend={breached.length > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
        <MetricCard
          label="Compliance"
          value={formatPercent(
            ((mockTickets.length - breached.length) / Math.max(1, mockTickets.length)) * 100,
            0,
          )}
          accent="#22C55E"
        />
      </div>
      <MiniTable
        columns={["Severity", "Total", "Breached", "Compliance"]}
        rows={bySev.map((r) => [
          <span key="sev" className="capitalize">
            {r.sev}
          </span>,
          String(r.total),
          <span key="b" className="font-mono text-rose-300">
            {r.breached}
          </span>,
          <span key="c" className="font-mono">
            {formatPercent(
              r.total > 0 ? ((r.total - r.breached) / r.total) * 100 : 100,
              0,
            )}
          </span>,
        ])}
      />
    </PreviewShell>
  );
}

function BoardPackPreview() {
  return (
    <PreviewShell title="Quarterly board pack" description="Composite summary across pillars.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard emphasis label="Revenue (Q)" value={formatIDRCompact(6_540_000_000)} trend="up" />
        <MetricCard label="Gross margin" value="38%" trend="up" accent="#22C55E" />
        <MetricCard
          icon={Hourglass}
          label="Utilization"
          value="85.6%"
          trend="up"
          accent="#3B82F6"
        />
        <MetricCard
          icon={Calendar}
          label="On-time delivery"
          value="78%"
          accent="#F59E0B"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Wins</div>
          <ul className="mt-2 space-y-1 text-[11px] text-zinc-200">
            <li>· Won 2 lighthouse logos in fintech vertical</li>
            <li>· Sprint velocity up 18% vs prior quarter</li>
            <li>· Cashflow turned positive against forecast</li>
          </ul>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Risks</div>
          <ul className="mt-2 space-y-1 text-[11px] text-zinc-200">
            <li>· 2 projects flagged red; recovery plans in flight</li>
            <li>· Backend bench thin; 3 open reqs unfilled &gt;60 days</li>
            <li>· One enterprise client renewal at risk</li>
          </ul>
        </div>
      </div>
    </PreviewShell>
  );
}
