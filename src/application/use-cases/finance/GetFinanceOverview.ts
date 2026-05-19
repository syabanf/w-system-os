import type { InvoiceRepository } from "@/domain/repositories/InvoiceRepository";
import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { totalOutstanding } from "@/domain/rules/profitability.rules";
import { projectGrossMargin } from "@/domain/rules/profitability.rules";
import type { FinanceOverviewDTO } from "@/application/dtos/FinanceDTO";
import { mockRevenueTrend } from "@/infrastructure/data/analytics.mock";

export class GetFinanceOverview {
  constructor(
    private invoices: InvoiceRepository,
    private clients: ClientRepository,
    private projects: ProjectRepository,
  ) {}

  async execute(): Promise<FinanceOverviewDTO> {
    const [allInvoices, outstanding, overdue, allClients, allProjects] = await Promise.all([
      this.invoices.getAll(),
      this.invoices.getOutstanding(),
      this.invoices.getOverdue(),
      this.clients.getAll(),
      this.projects.getAll(),
    ]);

    const clientMap = new Map(allClients.map((c) => [c.id, c.name]));
    const projectMap = new Map(allProjects.map((p) => [p.id, p.name]));

    const invoices = allInvoices
      .slice()
      .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))
      .map((inv) => ({
        ...inv,
        clientName: clientMap.get(inv.clientId) ?? "Unknown",
        projectName: projectMap.get(inv.projectId) ?? "Unknown",
      }));

    const trend = mockRevenueTrend;
    const monthlyRevenue = trend[trend.length - 1].revenue;
    const forecastNextMonth = Math.round(monthlyRevenue * 1.08);

    const paidThisMonth = allInvoices
      .filter((i) => i.status === "paid" && i.issueDate.startsWith("2026-05"))
      .reduce((s, i) => s + i.paidAmount, 0);

    const profitabilityByProject = allProjects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      grossMargin: projectGrossMargin(p),
      revenue: p.budget,
      cost: p.actualCost,
    }));

    return {
      monthlyRevenue,
      outstandingTotal: totalOutstanding(outstanding),
      overdueTotal: totalOutstanding(overdue),
      paidThisMonth,
      forecastNextMonth,
      invoices,
      trend,
      profitabilityByProject,
    };
  }
}
