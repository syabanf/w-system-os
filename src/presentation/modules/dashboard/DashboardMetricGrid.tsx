"use client";

import {
  Briefcase,
  CheckCircle2,
  Flame,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import type { DashboardSummaryDTO } from "@/application/dtos/DashboardDTO";

export function DashboardMetricGrid({ data }: { data: DashboardSummaryDTO }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        emphasis
        icon={TrendingUp}
        label="Monthly Revenue"
        value={formatIDRCompact(data.monthlyRevenue)}
        delta={`${data.monthlyRevenueDelta >= 0 ? "+" : ""}${data.monthlyRevenueDelta.toFixed(1)}%`}
        trend={data.monthlyRevenueDelta >= 0 ? "up" : "down"}
        hint="vs prev month"
      />
      <MetricCard
        icon={Briefcase}
        label="Active Projects"
        value={String(data.activeProjects)}
        delta={`${data.atRiskProjects} at risk`}
        trend={data.atRiskProjects > 0 ? "down" : "flat"}
        accent="#71717A"
      />
      <MetricCard
        icon={Users}
        label="Utilization"
        value={formatPercent(data.utilizationRate, 1)}
        delta={`${formatPercent(data.billableHoursRatio, 0)} billable`}
        trend={data.utilizationRate > 95 ? "down" : "up"}
        accent="#FB7185"
      />
      <MetricCard
        icon={Receipt}
        label="Outstanding"
        value={formatIDRCompact(data.outstandingInvoices)}
        delta={`${data.outstandingCount} invoices`}
        trend={data.outstandingCount > 6 ? "down" : "flat"}
        accent="#F59E0B"
      />
      <MetricCard
        icon={Flame}
        label="SLA Breaches"
        value={String(data.slaBreaches)}
        delta={`${data.openTickets} open tickets`}
        trend={data.slaBreaches > 0 ? "down" : "flat"}
        accent="#EF4444"
      />
      <MetricCard
        icon={CheckCircle2}
        label="Win Rate"
        value={formatPercent(data.leadConversionRate, 0)}
        delta={formatIDRCompact(data.pipelineValue) + " pipeline"}
        trend="up"
        accent="#22C55E"
      />
    </div>
  );
}
