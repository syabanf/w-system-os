import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { Project } from "@/domain/entities/Project";
import { mockProjects } from "@/infrastructure/data/projects.mock";

export class MockProjectRepository implements ProjectRepository {
  async getAll(): Promise<Project[]> {
    return mockProjects;
  }
  async getById(id: string): Promise<Project | null> {
    return mockProjects.find((p) => p.id === id) ?? null;
  }
  async getAtRiskProjects(): Promise<Project[]> {
    return mockProjects.filter(
      (p) => p.riskLevel === "high" || p.riskLevel === "critical",
    );
  }
  async getByClientId(clientId: string): Promise<Project[]> {
    return mockProjects.filter((p) => p.clientId === clientId);
  }
}
