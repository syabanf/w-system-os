import type { ID, ISODate } from "@/types/common";

export type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Review" | "QA" | "Done";

export const TASK_STATUSES: TaskStatus[] = [
  "Backlog",
  "To Do",
  "In Progress",
  "Review",
  "QA",
  "Done",
];

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: ID;
  code: string;
  title: string;
  projectId: ID;
  sprintId?: ID;
  /** User story this sprint task belongs to (Epic → Story → Task). */
  userStoryId?: ID;
  status: TaskStatus;
  priority: TaskPriority;
  /** Story points effort estimate carried up to the user story and epic level. */
  storyPoints: number;
  assigneeId: ID;
  blocked: boolean;
  blockerReason?: string;
  createdAt: ISODate;
  dueDate?: ISODate;
}
