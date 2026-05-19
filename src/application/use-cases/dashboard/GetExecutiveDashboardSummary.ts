import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { InvoiceRepository } from "@/domain/repositories/InvoiceRepository";
import type { TicketRepository } from "@/domain/repositories/TicketRepository";
import type { TeamRepository } from "@/domain/repositories/TeamRepository";
import type { LeadRepository } from "@/domain/repositories/LeadRepository";
import type { TimesheetRepository } from "@/domain/repositories/TimesheetRepository";
import type { DashboardSummaryDTO } from "@/application/dtos/DashboardDTO";
import { totalOutstanding, totalRevenue } from "@/domain/rules/profitability.rules";
import { averageUtilization } from "@/domain/rules/utilization.rules";
import { mockRevenueTrend, mockActivityFeed, mockRiskAlerts } from "@/infrastructure/data/analytics.mock";

export class GetExecutiveDashboardSummary {
  constructor(
    private projects: ProjectRepository,
    private invoices: InvoiceRepository,
    private tickets: TicketRepository,
    private team: TeamRepository,
    private leads: LeadRepository,
    private timesheet: TimesheetRepository,
  ) {}

  async execute(): Promise<DashboardSummaryDTO> {
    const [
      allProjects,
      atRiskProjects,
      allInvoices,
      outstandingInvoices,
      allMembers,
      allLeads,
      allTickets,
      breachedTickets,
      allTimesheet,
    ] = await Promise.all([
      this.projects.getAll(),
      this.projects.getAtRiskProjects(),
      this.invoices.getAll(),
      this.invoices.getOutstanding(),
      this.team.getAll(),
      this.leads.getAll(),
      this.tickets.getOpenTickets(),
      this.tickets.getSLABreached(),
      this.timesheet.getAll(),
    ]);

    const revenuePaid = totalRevenue(allInvoices);
    const monthlyRevenue = mockRevenueTrend[mockRevenueTrend.length - 1].revenue;
    const previousMonth = mockRevenueTrend[mockRevenueTrend.length - 2].revenue;
    const monthlyRevenueDelta = ((monthlyRevenue - previousMonth) / previousMonth) * 100;

    const outstandingTotal = totalOutstanding(outstandingInvoices);

    const utilizationRate = averageUtilization(allMembers);

    const totalHours = allTimesheet.reduce((sum, t) => sum + t.hours, 0);
    const billableHours = allTimesheet
      .filter((t) => t.billable)
      .reduce((sum, t) => sum + t.hours, 0);
    const billableHoursRatio = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

    const wonLeads = allLeads.filter((l) => l.stage === "Won").length;
    const closedLeads = allLeads.filter((l) => l.stage === "Won" || l.stage === "Lost").length;
    const leadConversionRate = closedLeads > 0 ? (wonLeads / closedLeads) * 100 : 0;
    const pipelineValue = allLeads
      .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
      .reduce((sum, l) => sum + l.dealValue * (l.probability / 100), 0);

    const activeProjects = allProjects.filter(
      (p) => p.status !== "Delivered" && p.status !== "Maintenance",
    ).length;

    return {
      monthlyRevenue,
      monthlyRevenueDelta,
      outstandingInvoices: outstandingTotal,
      outstandingCount: outstandingInvoices.length,
      activeProjects,
      atRiskProjects: atRiskProjects.length,
      utilizationRate,
      billableHoursRatio,
      openTickets: allTickets.length,
      slaBreaches: breachedTickets.length,
      leadConversionRate,
      pipelineValue,
      topAtRisk: atRiskProjects.slice(0, 5),
      revenueTrend: mockRevenueTrend,
      activityFeed: mockActivityFeed,
      riskAlerts: mockRiskAlerts,
    };
  }
}
