import type { Project } from "@/domain/entities/Project";

export interface ProjectOverviewDTO extends Project {
  clientName: string;
  budgetUtilization: number;
  managerName: string;
  grossMargin: number;
}
