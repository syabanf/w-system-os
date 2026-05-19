import type { TimesheetRepository } from "@/domain/repositories/TimesheetRepository";
import type { TimesheetEntry } from "@/domain/entities/Timesheet";
import { mockTimesheet } from "@/infrastructure/data/timesheet.mock";

export class MockTimesheetRepository implements TimesheetRepository {
  async getAll(): Promise<TimesheetEntry[]> {
    return mockTimesheet;
  }
  async getByMemberId(memberId: string): Promise<TimesheetEntry[]> {
    return mockTimesheet.filter((t) => t.memberId === memberId);
  }
  async getByProjectId(projectId: string): Promise<TimesheetEntry[]> {
    return mockTimesheet.filter((t) => t.projectId === projectId);
  }
  async getPendingApproval(): Promise<TimesheetEntry[]> {
    return mockTimesheet.filter((t) => t.approvalStatus === "submitted");
  }
}
