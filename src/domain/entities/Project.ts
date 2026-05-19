import type { ID, ISODate } from "@/types/common";
import type { ProjectStatus } from "../value-objects/ProjectStatus";
import type { RiskLevel } from "../value-objects/RiskLevel";

export interface Project {
  id: ID;
  code: string;
  name: string;
  clientId: ID;
  status: ProjectStatus;
  progress: number; // 0..100
  budget: number;
  actualCost: number;
  riskLevel: RiskLevel;
  startDate: ISODate;
  endDate: ISODate;
  projectManagerId: ID;
  teamIds: ID[];
  health: "green" | "amber" | "red";
  techStack: string[];
  openTickets: number;
  changeRequests: number;
}
