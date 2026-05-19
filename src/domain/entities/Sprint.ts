import type { ID, ISODate } from "@/types/common";

export interface Sprint {
  id: ID;
  name: string;
  projectId: ID;
  startDate: ISODate;
  endDate: ISODate;
  goal: string;
  committedPoints: number;
  completedPoints: number;
  status: "planning" | "active" | "completed";
}
