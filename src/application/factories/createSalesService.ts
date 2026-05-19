import { MockLeadRepository } from "@/infrastructure/repositories/mock/MockLeadRepository";
import { GetSalesPipeline } from "../use-cases/crm/GetSalesPipeline";
import { CalculateLeadConversion } from "../use-cases/crm/CalculateLeadConversion";
import { SalesService } from "../services/SalesService";

export function createSalesService(): SalesService {
  const leads = new MockLeadRepository();
  return new SalesService(new GetSalesPipeline(leads), new CalculateLeadConversion(leads));
}
