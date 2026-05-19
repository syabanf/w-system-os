import type { Project } from "../entities/Project";

export interface ProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  getAtRiskProjects(): Promise<Project[]>;
  getByClientId(clientId: string): Promise<Project[]>;
}
