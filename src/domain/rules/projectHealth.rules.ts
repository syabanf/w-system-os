import type { Project } from "../entities/Project";
import type { RiskLevel } from "../value-objects/RiskLevel";

export function deriveBudgetUtilization(project: Project): number {
  if (project.budget === 0) return 0;
  return (project.actualCost / project.budget) * 100;
}

export function deriveProjectRisk(project: Project): RiskLevel {
  const utilization = deriveBudgetUtilization(project);
  if (utilization > 105) return "critical";
  if (utilization > 90 && project.progress < 80) return "high";
  if (utilization > 75 && project.progress < 60) return "medium";
  if (project.openTickets > 8) return "high";
  return "low";
}

export function deriveHealthBadge(project: Project): "green" | "amber" | "red" {
  const risk = deriveProjectRisk(project);
  if (risk === "critical" || risk === "high") return "red";
  if (risk === "medium") return "amber";
  return "green";
}
