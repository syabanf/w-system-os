import type { TimesheetEntry } from "../entities/Timesheet";

export interface TimesheetRepository {
  getAll(): Promise<TimesheetEntry[]>;
  getByMemberId(memberId: string): Promise<TimesheetEntry[]>;
  getByProjectId(projectId: string): Promise<TimesheetEntry[]>;
  getPendingApproval(): Promise<TimesheetEntry[]>;
}
