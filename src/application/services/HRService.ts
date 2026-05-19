import type { GetHROverview } from "../use-cases/hr/GetHROverview";

export class HRService {
  constructor(private overview: GetHROverview) {}
  getOverview() {
    return this.overview.execute();
  }
}
