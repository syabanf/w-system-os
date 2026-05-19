import type { GetLeadInsights } from "../use-cases/leads/GetLeadInsights";

export class LeadService {
  constructor(private insights: GetLeadInsights) {}
  getInsights() {
    return this.insights.execute();
  }
}
