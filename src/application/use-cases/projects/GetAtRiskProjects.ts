import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";

export class GetAtRiskProjects {
  constructor(private projectRepository: ProjectRepository) {}
  async execute() {
    return this.projectRepository.getAtRiskProjects();
  }
}
