import type { Contract } from "../entities/Contract";
import type { Proposal } from "../entities/Proposal";

export interface ContractRepository {
  getAll(): Promise<Contract[]>;
  getById(id: string): Promise<Contract | null>;
  getUpcomingRenewals(daysAhead?: number): Promise<Contract[]>;
}

export interface ProposalRepository {
  getAll(): Promise<Proposal[]>;
  getById(id: string): Promise<Proposal | null>;
}
