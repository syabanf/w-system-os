export type MilestoneStatus =
  | "waiting-action"
  | "already-sent"
  | "in-progress"
  | "approved"
  | "overdue";

export type MilestoneSection =
  | "workflow"
  | "payment"
  | "credential"
  | "development";

export interface ProjectMilestone {
  id: string;
  projectId: string; // FK → Project.id
  section: MilestoneSection;
  /** Stable identifier within the section (e.g. "project-brief", "down-payment").
   *  Used to upsert canonical rows for a project on first hydrate. */
  kind: string;
  label: string;
  status: MilestoneStatus;
  driveLink?: string;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  ownerId?: string; // FK → TeamMember.id
}
