import { MockProjectRepository } from "@/infrastructure/repositories/mock/MockProjectRepository";
import { MockClientRepository } from "@/infrastructure/repositories/mock/MockClientRepository";
import { MockTeamRepository } from "@/infrastructure/repositories/mock/MockTeamRepository";
import { GetProjectOverview } from "../use-cases/projects/GetProjectOverview";
import { GetAtRiskProjects } from "../use-cases/projects/GetAtRiskProjects";
import { ProjectService } from "../services/ProjectService";

export function createProjectService(): ProjectService {
  const projects = new MockProjectRepository();
  return new ProjectService(
    new GetProjectOverview(projects, new MockClientRepository(), new MockTeamRepository()),
    new GetAtRiskProjects(projects),
  );
}
