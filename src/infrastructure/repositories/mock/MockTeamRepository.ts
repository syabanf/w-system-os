import type { TeamRepository } from "@/domain/repositories/TeamRepository";
import type { TeamMember } from "@/domain/entities/TeamMember";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { isOverallocated, isUnderutilized } from "@/domain/rules/utilization.rules";

export class MockTeamRepository implements TeamRepository {
  async getAll(): Promise<TeamMember[]> {
    return mockTeam;
  }
  async getById(id: string): Promise<TeamMember | null> {
    return mockTeam.find((m) => m.id === id) ?? null;
  }
  async getOverallocated(): Promise<TeamMember[]> {
    return mockTeam.filter(isOverallocated);
  }
  async getAvailable(): Promise<TeamMember[]> {
    return mockTeam.filter(isUnderutilized);
  }
}
