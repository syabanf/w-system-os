import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { TeamRepository } from "@/domain/repositories/TeamRepository";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import { deriveBudgetUtilization, deriveHealthBadge } from "@/domain/rules/projectHealth.rules";
import { projectGrossMargin } from "@/domain/rules/profitability.rules";

export class GetProjectOverview {
  constructor(
    private projects: ProjectRepository,
    private clients: ClientRepository,
    private team: TeamRepository,
  ) {}

  async execute(): Promise<ProjectOverviewDTO[]> {
    const [allProjects, allClients, allTeam] = await Promise.all([
      this.projects.getAll(),
      this.clients.getAll(),
      this.team.getAll(),
    ]);

    const clientMap = new Map(allClients.map((c) => [c.id, c.name]));
    const teamMap = new Map(allTeam.map((m) => [m.id, m.name]));

    return allProjects.map((project) => ({
      ...project,
      clientName: clientMap.get(project.clientId) ?? "Unknown",
      managerName: teamMap.get(project.projectManagerId) ?? "Unassigned",
      budgetUtilization: deriveBudgetUtilization(project),
      grossMargin: projectGrossMargin(project),
      health: deriveHealthBadge(project),
    }));
  }
}
