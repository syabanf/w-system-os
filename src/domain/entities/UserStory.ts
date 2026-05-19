import type { ID } from "@/types/common";

export type UserStoryStatus = "Backlog" | "Ready" | "In Progress" | "Review" | "Done";
export type UserStoryPriority = "low" | "medium" | "high" | "critical";

export interface UserStory {
  id: ID;
  code: string;
  title: string;
  // Classic "As a … I want … so that …" format.
  asA: string;
  iWant: string;
  soThat: string;
  epicId: ID;
  projectId: ID;
  status: UserStoryStatus;
  priority: UserStoryPriority;
  storyPoints: number;
  acceptanceCriteria: string[];
  ownerId: ID;
}
