import { MockLeadRepository } from "@/infrastructure/repositories/mock/MockLeadRepository";
import { GetLeadInsights } from "../use-cases/leads/GetLeadInsights";
import { LeadService } from "../services/LeadService";

export function createLeadService(): LeadService {
  return new LeadService(new GetLeadInsights(new MockLeadRepository()));
}
