import { MockProjectRepository } from "@/infrastructure/repositories/mock/MockProjectRepository";
import { MockInvoiceRepository } from "@/infrastructure/repositories/mock/MockInvoiceRepository";
import { MockTicketRepository } from "@/infrastructure/repositories/mock/MockTicketRepository";
import { MockTeamRepository } from "@/infrastructure/repositories/mock/MockTeamRepository";
import { MockLeadRepository } from "@/infrastructure/repositories/mock/MockLeadRepository";
import { MockTimesheetRepository } from "@/infrastructure/repositories/mock/MockTimesheetRepository";
import { GetExecutiveDashboardSummary } from "../use-cases/dashboard/GetExecutiveDashboardSummary";
import { DashboardService } from "../services/DashboardService";

export function createDashboardService(): DashboardService {
  const summary = new GetExecutiveDashboardSummary(
    new MockProjectRepository(),
    new MockInvoiceRepository(),
    new MockTicketRepository(),
    new MockTeamRepository(),
    new MockLeadRepository(),
    new MockTimesheetRepository(),
  );
  return new DashboardService(summary);
}
