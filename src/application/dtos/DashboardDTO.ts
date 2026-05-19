import type { Project } from "@/domain/entities/Project";
import type { ActivityFeedItem, RiskAlert, RevenuePoint } from "@/infrastructure/data/analytics.mock";

export interface DashboardSummaryDTO {
  monthlyRevenue: number;
  monthlyRevenueDelta: number; // % vs previous month
  outstandingInvoices: number;
  outstandingCount: number;
  activeProjects: number;
  atRiskProjects: number;
  utilizationRate: number; // %
  billableHoursRatio: number; // %
  openTickets: number;
  slaBreaches: number;
  leadConversionRate: number; // %
  pipelineValue: number;
  topAtRisk: Project[];
  revenueTrend: RevenuePoint[];
  activityFeed: ActivityFeedItem[];
  riskAlerts: RiskAlert[];
}
