import type { GetTicketSLAOverview } from "../use-cases/support/GetTicketSLAOverview";

export class SupportService {
  constructor(private overview: GetTicketSLAOverview) {}
  getOverview() {
    return this.overview.execute();
  }
}
