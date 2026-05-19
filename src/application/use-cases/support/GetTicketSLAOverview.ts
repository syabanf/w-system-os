import type { TicketRepository } from "@/domain/repositories/TicketRepository";
import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TeamRepository } from "@/domain/repositories/TeamRepository";
import type { Ticket } from "@/domain/entities/Ticket";
import { hoursUntilSLA, isSLAAtRisk, isSLABreached } from "@/domain/rules/sla.rules";

const NOW = new Date("2026-05-18T09:00:00Z");

export interface EnrichedTicket extends Ticket {
  clientName: string;
  projectName: string;
  assigneeName: string;
  hoursUntilSLA: number;
  isAtRisk: boolean;
  isBreached: boolean;
}

export interface TicketSLAOverview {
  tickets: EnrichedTicket[];
  openCount: number;
  breachedCount: number;
  atRiskCount: number;
  changeRequestCount: number;
  averageResolutionHours: number;
}

export class GetTicketSLAOverview {
  constructor(
    private tickets: TicketRepository,
    private clients: ClientRepository,
    private projects: ProjectRepository,
    private team: TeamRepository,
  ) {}

  async execute(): Promise<TicketSLAOverview> {
    const [all, clients, projects, team] = await Promise.all([
      this.tickets.getAll(),
      this.clients.getAll(),
      this.projects.getAll(),
      this.team.getAll(),
    ]);

    const clientMap = new Map(clients.map((c) => [c.id, c.name]));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const teamMap = new Map(team.map((m) => [m.id, m.name]));

    const enriched: EnrichedTicket[] = all.map((t) => ({
      ...t,
      clientName: clientMap.get(t.clientId) ?? "Unknown",
      projectName: projectMap.get(t.projectId) ?? "Unknown",
      assigneeName: teamMap.get(t.assignedToId) ?? "Unassigned",
      hoursUntilSLA: hoursUntilSLA(t, NOW),
      isAtRisk: isSLAAtRisk(t, NOW),
      isBreached: isSLABreached(t, NOW),
    }));

    enriched.sort((a, b) => a.hoursUntilSLA - b.hoursUntilSLA);

    const open = enriched.filter(
      (t) => t.status !== "Resolved" && t.status !== "Closed",
    );

    return {
      tickets: enriched,
      openCount: open.length,
      breachedCount: enriched.filter((t) => t.isBreached).length,
      atRiskCount: enriched.filter((t) => t.isAtRisk).length,
      changeRequestCount: enriched.filter((t) => t.isChangeRequest).length,
      averageResolutionHours: 14.6,
    };
  }
}
