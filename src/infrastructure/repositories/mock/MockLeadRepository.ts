import type { LeadRepository } from "@/domain/repositories/LeadRepository";
import type { Lead, LeadStage } from "@/domain/entities/Lead";
import { mockLeads } from "@/infrastructure/data/leads.mock";

export class MockLeadRepository implements LeadRepository {
  async getAll(): Promise<Lead[]> {
    return mockLeads;
  }
  async getById(id: string): Promise<Lead | null> {
    return mockLeads.find((l) => l.id === id) ?? null;
  }
  async getByStage(stage: LeadStage): Promise<Lead[]> {
    return mockLeads.filter((l) => l.stage === stage);
  }
}
