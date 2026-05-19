import type { ContractRepository, ProposalRepository } from "@/domain/repositories/ContractRepository";
import type { Contract } from "@/domain/entities/Contract";
import type { Proposal } from "@/domain/entities/Proposal";
import { mockContracts, mockProposals } from "@/infrastructure/data/contracts.mock";

const NOW = new Date("2026-05-18T09:00:00Z");

export class MockContractRepository implements ContractRepository {
  async getAll(): Promise<Contract[]> {
    return mockContracts;
  }
  async getById(id: string): Promise<Contract | null> {
    return mockContracts.find((c) => c.id === id) ?? null;
  }
  async getUpcomingRenewals(daysAhead = 90): Promise<Contract[]> {
    const limit = NOW.getTime() + daysAhead * 24 * 60 * 60 * 1000;
    return mockContracts.filter((c) => {
      const end = new Date(c.endDate).getTime();
      return end >= NOW.getTime() && end <= limit;
    });
  }
}

export class MockProposalRepository implements ProposalRepository {
  async getAll(): Promise<Proposal[]> {
    return mockProposals;
  }
  async getById(id: string): Promise<Proposal | null> {
    return mockProposals.find((p) => p.id === id) ?? null;
  }
}
