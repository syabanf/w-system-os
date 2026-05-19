import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { Client } from "@/domain/entities/Client";

export interface ClientPortfolioItem extends Client {
  projectCount: number;
  totalProjectBudget: number;
}

export class GetClientPortfolio {
  constructor(
    private clients: ClientRepository,
    private projects: ProjectRepository,
  ) {}

  async execute(): Promise<ClientPortfolioItem[]> {
    const [allClients, allProjects] = await Promise.all([
      this.clients.getAll(),
      this.projects.getAll(),
    ]);

    return allClients.map((client) => {
      const projects = allProjects.filter((p) => p.clientId === client.id);
      return {
        ...client,
        projectCount: projects.length,
        totalProjectBudget: projects.reduce((sum, p) => sum + p.budget, 0),
      };
    });
  }
}
