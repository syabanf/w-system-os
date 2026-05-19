import type { LeadRepository } from "@/domain/repositories/LeadRepository";

export class CalculateLeadConversion {
  constructor(private leads: LeadRepository) {}

  async execute(): Promise<{
    conversionRate: number;
    wonCount: number;
    lostCount: number;
    pipelineCount: number;
  }> {
    const all = await this.leads.getAll();
    const won = all.filter((l) => l.stage === "Won").length;
    const lost = all.filter((l) => l.stage === "Lost").length;
    const closed = won + lost;
    const conversionRate = closed > 0 ? (won / closed) * 100 : 0;
    return {
      conversionRate,
      wonCount: won,
      lostCount: lost,
      pipelineCount: all.length - closed,
    };
  }
}
