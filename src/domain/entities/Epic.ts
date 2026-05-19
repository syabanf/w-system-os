import type { ID, ISODate } from "@/types/common";

export type EpicStatus = "Discovery" | "In Progress" | "At Risk" | "Done" | "Cancelled";

export interface Epic {
  id: ID;
  code: string;
  name: string;
  description: string;
  projectId: ID;
  ownerId: ID;
  status: EpicStatus;
  color: string; // accent for tree row + tags
  startDate: ISODate;
  targetDate: ISODate;
  committedPoints: number;
  completedPoints: number;
}
