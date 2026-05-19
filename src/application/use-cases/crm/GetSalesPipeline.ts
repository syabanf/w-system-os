import type { LeadRepository } from "@/domain/repositories/LeadRepository";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/domain/entities/Lead";

export interface PipelineStage {
  stage: LeadStage;
  leads: Lead[];
  totalValue: number;
  weightedValue: number;
}

export class GetSalesPipeline {
  constructor(private leads: LeadRepository) {}

  async execute(): Promise<PipelineStage[]> {
    const all = await this.leads.getAll();
    return LEAD_STAGES.map((stage) => {
      const leads = all.filter((l) => l.stage === stage);
      const totalValue = leads.reduce((sum, l) => sum + l.dealValue, 0);
      const weightedValue = leads.reduce(
        (sum, l) => sum + l.dealValue * (l.probability / 100),
        0,
      );
      return { stage, leads, totalValue, weightedValue };
    });
  }
}
