import { MockClientRepository } from "@/infrastructure/repositories/mock/MockClientRepository";
import { MockProjectRepository } from "@/infrastructure/repositories/mock/MockProjectRepository";
import { GetClientPortfolio } from "../use-cases/clients/GetClientPortfolio";
import { ClientService } from "../services/ClientService";

export function createClientService(): ClientService {
  return new ClientService(
    new GetClientPortfolio(new MockClientRepository(), new MockProjectRepository()),
  );
}
