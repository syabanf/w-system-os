export interface VelocityPoint {
  sprintLabel: string;
  sprintCode: string;
  startDate: string;
  endDate: string;
  committed: number;
  completed: number;
  status: "completed" | "active";
}

// Last 6 sprints (per active sprint family). Recent sprints are still in flight.
export const mockVelocityHistory: VelocityPoint[] = [
  { sprintLabel: "S13", sprintCode: "sp-old-13", startDate: "2026-02-24", endDate: "2026-03-09", committed: 58, completed: 52, status: "completed" },
  { sprintLabel: "S14", sprintCode: "sp-old-14", startDate: "2026-03-10", endDate: "2026-03-23", committed: 62, completed: 60, status: "completed" },
  { sprintLabel: "S15", sprintCode: "sp-old-15", startDate: "2026-03-24", endDate: "2026-04-06", committed: 65, completed: 56, status: "completed" },
  { sprintLabel: "S16", sprintCode: "sp-old-16", startDate: "2026-04-07", endDate: "2026-04-20", committed: 60, completed: 64, status: "completed" },
  { sprintLabel: "S17", sprintCode: "sp-old-17", startDate: "2026-04-21", endDate: "2026-05-04", committed: 66, completed: 58, status: "completed" },
  { sprintLabel: "S18 (active)", sprintCode: "sp-001", startDate: "2026-05-05", endDate: "2026-05-19", committed: 64, completed: 42, status: "active" },
];
