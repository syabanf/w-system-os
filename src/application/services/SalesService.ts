import type { GetSalesPipeline } from "../use-cases/crm/GetSalesPipeline";
import type { CalculateLeadConversion } from "../use-cases/crm/CalculateLeadConversion";

export class SalesService {
  constructor(
    private pipeline: GetSalesPipeline,
    private conversion: CalculateLeadConversion,
  ) {}
  getPipeline() {
    return this.pipeline.execute();
  }
  getConversion() {
    return this.conversion.execute();
  }
}
