import { MockContractRepository, MockProposalRepository } from "@/infrastructure/repositories/mock/MockContractRepository";
import { MockClientRepository } from "@/infrastructure/repositories/mock/MockClientRepository";
import { GetContractSummary } from "../use-cases/contracts/GetContractSummary";
import { ContractService } from "../services/ContractService";

export function createContractService(): ContractService {
  return new ContractService(
    new GetContractSummary(
      new MockContractRepository(),
      new MockProposalRepository(),
      new MockClientRepository(),
    ),
  );
}
