import { MockTicketRepository } from "@/infrastructure/repositories/mock/MockTicketRepository";
import { MockClientRepository } from "@/infrastructure/repositories/mock/MockClientRepository";
import { MockProjectRepository } from "@/infrastructure/repositories/mock/MockProjectRepository";
import { MockTeamRepository } from "@/infrastructure/repositories/mock/MockTeamRepository";
import { GetTicketSLAOverview } from "../use-cases/support/GetTicketSLAOverview";
import { SupportService } from "../services/SupportService";

export function createSupportService(): SupportService {
  return new SupportService(
    new GetTicketSLAOverview(
      new MockTicketRepository(),
      new MockClientRepository(),
      new MockProjectRepository(),
      new MockTeamRepository(),
    ),
  );
}
