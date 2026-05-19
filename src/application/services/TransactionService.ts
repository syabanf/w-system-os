import type { GetTransactionOverview } from "../use-cases/transaction/GetTransactionOverview";

export class TransactionService {
  constructor(private overview: GetTransactionOverview) {}
  getOverview() {
    return this.overview.execute();
  }
}
