import type { GetExecutiveDashboardSummary } from "../use-cases/dashboard/GetExecutiveDashboardSummary";

export class DashboardService {
  constructor(private summary: GetExecutiveDashboardSummary) {}
  getSummary() {
    return this.summary.execute();
  }
}
