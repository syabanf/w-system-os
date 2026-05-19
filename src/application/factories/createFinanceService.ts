import { MockInvoiceRepository } from "@/infrastructure/repositories/mock/MockInvoiceRepository";
import { MockClientRepository } from "@/infrastructure/repositories/mock/MockClientRepository";
import { MockProjectRepository } from "@/infrastructure/repositories/mock/MockProjectRepository";
import { GetFinanceOverview } from "../use-cases/finance/GetFinanceOverview";
import { FinanceService } from "../services/FinanceService";

export function createFinanceService(): FinanceService {
  return new FinanceService(
    new GetFinanceOverview(
      new MockInvoiceRepository(),
      new MockClientRepository(),
      new MockProjectRepository(),
    ),
  );
}
