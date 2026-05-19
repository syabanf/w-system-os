export type RiskLevel = "low" | "medium" | "high" | "critical";

export const RISK_ORDER: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};
