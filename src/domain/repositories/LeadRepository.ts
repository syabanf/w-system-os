import type { Lead, LeadStage } from "../entities/Lead";

export interface LeadRepository {
  getAll(): Promise<Lead[]>;
  getById(id: string): Promise<Lead | null>;
  getByStage(stage: LeadStage): Promise<Lead[]>;
}
