import type { GetFinanceOverview } from "../use-cases/finance/GetFinanceOverview";

export class FinanceService {
  constructor(private overview: GetFinanceOverview) {}
  getOverview() {
    return this.overview.execute();
  }
}
