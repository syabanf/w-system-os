import { MockTeamRepository } from "@/infrastructure/repositories/mock/MockTeamRepository";
import { GetTeamUtilization } from "../use-cases/resources/GetTeamUtilization";
import { ResourceService } from "../services/ResourceService";

export function createResourceService(): ResourceService {
  return new ResourceService(new GetTeamUtilization(new MockTeamRepository()));
}
