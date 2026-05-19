import type { ID } from "@/types/common";

export type Department =
  | "Product"
  | "UI/UX"
  | "Frontend"
  | "Backend"
  | "QA"
  | "DevOps"
  | "Project Management"
  | "Business Analyst";

export type Availability = "available" | "busy" | "overloaded" | "on-leave";

export interface TeamMember {
  id: ID;
  name: string;
  initials: string;
  role: string;
  department: Department;
  email: string;
  capacityHours: number; // weekly capacity
  allocatedHours: number; // weekly allocation
  allocationPercent: number; // 0..150 (over-allocated possible)
  skills: string[];
  availability: Availability;
  avatarColor: string;
  activeProjectIds: ID[];
}
