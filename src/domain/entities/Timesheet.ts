import type { ID, ISODate } from "@/types/common";

export type ApprovalStatus = "draft" | "submitted" | "approved" | "rejected";

export interface TimesheetEntry {
  id: ID;
  memberId: ID;
  projectId: ID;
  date: ISODate;
  hours: number;
  billable: boolean;
  description: string;
  approvalStatus: ApprovalStatus;
}
