import type { TeamRepository } from "@/domain/repositories/TeamRepository";
import type { TeamMember, Department } from "@/domain/entities/TeamMember";
import { averageUtilization } from "@/domain/rules/utilization.rules";

export interface UtilizationSummary {
  members: TeamMember[];
  averageUtilization: number;
  overallocatedCount: number;
  availableCount: number;
  byDepartment: { department: Department; average: number; headcount: number }[];
}

export class GetTeamUtilization {
  constructor(private team: TeamRepository) {}

  async execute(): Promise<UtilizationSummary> {
    const [members, overallocated, available] = await Promise.all([
      this.team.getAll(),
      this.team.getOverallocated(),
      this.team.getAvailable(),
    ]);

    const deptMap = new Map<Department, TeamMember[]>();
    members.forEach((m) => {
      const list = deptMap.get(m.department) ?? [];
      list.push(m);
      deptMap.set(m.department, list);
    });

    const byDepartment = Array.from(deptMap.entries()).map(([department, list]) => ({
      department,
      average: averageUtilization(list),
      headcount: list.length,
    }));

    return {
      members,
      averageUtilization: averageUtilization(members),
      overallocatedCount: overallocated.length,
      availableCount: available.length,
      byDepartment,
    };
  }
}
