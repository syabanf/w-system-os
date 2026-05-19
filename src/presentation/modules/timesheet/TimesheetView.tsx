"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Clock, FileText, Gauge } from "lucide-react";
import { createTimesheetService } from "@/application/factories/createTimesheetService";
import type { TimesheetSummary } from "@/application/use-cases/timesheet/GetTimesheetSummary";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { WeeklyTimesheetGrid } from "./WeeklyTimesheetGrid";
import { ProductivityChart } from "./ProductivityChart";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatPercent } from "@/lib/currency";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

type Row = TimesheetSummary["entries"][number];

export function TimesheetView() {
  const [summary, setSummary] = useState<TimesheetSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await createTimesheetService().getSummary();
      if (!cancelled) setSummary(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) return <SkeletonLoadingView />;

  const pendingRows = summary.entries.filter((e) => e.approvalStatus === "submitted").slice(0, 8);

  const columns: Column<Row>[] = [
    {
      key: "member",
      header: "Member",
      render: (r) => <span className="text-xs text-zinc-100">{r.memberName}</span>,
    },
    {
      key: "project",
      header: "Project",
      render: (r) => <span className="text-[11px] text-zinc-300">{r.projectName}</span>,
    },
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
        <ManageMasterDataButton moduleId="timesheet" />
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

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
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
        <SectionHeader eyebrow="Detail" title={`Entries (${summary.entries.length})`} />
        <DataTable<Row> columns={columns} rows={summary.entries} rowKey={(r) => r.id} dense />
      </div>
    </div>
  );
}
