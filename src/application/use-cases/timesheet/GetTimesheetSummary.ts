import type { TimesheetRepository } from "@/domain/repositories/TimesheetRepository";
import type { TeamRepository } from "@/domain/repositories/TeamRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TimesheetEntry } from "@/domain/entities/Timesheet";

export interface TimesheetSummary {
  entries: (TimesheetEntry & { memberName: string; projectName: string })[];
  totalHours: number;
  billableHours: number;
  billableRatio: number;
  pendingApproval: number;
  byDay: { date: string; total: number; billable: number }[];
}

export class GetTimesheetSummary {
  constructor(
    private timesheet: TimesheetRepository,
    private team: TeamRepository,
    private projects: ProjectRepository,
  ) {}

  async execute(): Promise<TimesheetSummary> {
    const [entries, members, projects] = await Promise.all([
      this.timesheet.getAll(),
      this.team.getAll(),
      this.projects.getAll(),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m.name]));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    const enriched = entries.map((e) => ({
      ...e,
      memberName: memberMap.get(e.memberId) ?? "Unknown",
      projectName: projectMap.get(e.projectId) ?? "Unknown",
    }));

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);

    const dayMap = new Map<string, { total: number; billable: number }>();
    entries.forEach((e) => {
      const cur = dayMap.get(e.date) ?? { total: 0, billable: 0 };
      cur.total += e.hours;
      if (e.billable) cur.billable += e.hours;
      dayMap.set(e.date, cur);
    });

    return {
      entries: enriched,
      totalHours,
      billableHours,
      billableRatio: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
      pendingApproval: entries.filter((e) => e.approvalStatus === "submitted").length,
      byDay: Array.from(dayMap.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, v]) => ({ date, total: v.total, billable: v.billable })),
    };
  }
}
