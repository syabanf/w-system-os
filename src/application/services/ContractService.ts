import type { GetContractSummary } from "../use-cases/contracts/GetContractSummary";

export class ContractService {
  constructor(private summary: GetContractSummary) {}
  getSummary() {
    return this.summary.execute();
  }
}
