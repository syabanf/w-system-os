import type { Invoice } from "@/domain/entities/Invoice";
import type { RevenuePoint } from "@/infrastructure/data/analytics.mock";

export interface FinanceOverviewDTO {
  monthlyRevenue: number;
  outstandingTotal: number;
  overdueTotal: number;
  paidThisMonth: number;
  forecastNextMonth: number;
  invoices: (Invoice & { clientName: string; projectName: string })[];
  trend: RevenuePoint[];
  profitabilityByProject: {
    projectId: string;
    projectName: string;
    grossMargin: number;
    revenue: number;
    cost: number;
  }[];
}
