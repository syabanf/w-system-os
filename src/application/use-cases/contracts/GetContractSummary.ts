import type { ContractRepository, ProposalRepository } from "@/domain/repositories/ContractRepository";
import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { Contract } from "@/domain/entities/Contract";
import type { Proposal } from "@/domain/entities/Proposal";

export interface EnrichedContract extends Contract {
  clientName: string;
  daysToExpiry: number;
}

export interface ContractSummary {
  contracts: EnrichedContract[];
  proposals: Proposal[];
  upcomingRenewals: EnrichedContract[];
  totalContractValue: number;
  totalProposalValue: number;
}

const NOW = new Date("2026-05-18T09:00:00Z");

export class GetContractSummary {
  constructor(
    private contracts: ContractRepository,
    private proposals: ProposalRepository,
    private clients: ClientRepository,
  ) {}

  async execute(): Promise<ContractSummary> {
    const [all, props, clients, renewals] = await Promise.all([
      this.contracts.getAll(),
      this.proposals.getAll(),
      this.clients.getAll(),
      this.contracts.getUpcomingRenewals(120),
    ]);

    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    const enrich = (c: Contract): EnrichedContract => ({
      ...c,
      clientName: clientMap.get(c.clientId) ?? "Unknown",
      daysToExpiry: Math.round(
        (new Date(c.endDate).getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24),
      ),
    });

    return {
      contracts: all.map(enrich),
      proposals: props,
      upcomingRenewals: renewals.map(enrich),
      totalContractValue: all.reduce((s, c) => s + c.value, 0),
      totalProposalValue: props.reduce((s, p) => s + p.value, 0),
    };
  }
}
