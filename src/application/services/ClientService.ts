import type { GetClientPortfolio } from "../use-cases/clients/GetClientPortfolio";

export class ClientService {
  constructor(private portfolio: GetClientPortfolio) {}
  getPortfolio() {
    return this.portfolio.execute();
  }
}
