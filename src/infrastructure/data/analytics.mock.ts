export interface RevenuePoint {
  month: string;
  revenue: number;
  forecast: number;
  cost: number;
}

export const mockRevenueTrend: RevenuePoint[] = [
  { month: "Dec", revenue: 1_650_000_000, forecast: 1_600_000_000, cost: 980_000_000 },
  { month: "Jan", revenue: 1_780_000_000, forecast: 1_750_000_000, cost: 1_050_000_000 },
  { month: "Feb", revenue: 1_840_000_000, forecast: 1_800_000_000, cost: 1_080_000_000 },
  { month: "Mar", revenue: 1_920_000_000, forecast: 1_900_000_000, cost: 1_120_000_000 },
  { month: "Apr", revenue: 2_080_000_000, forecast: 2_000_000_000, cost: 1_240_000_000 },
  { month: "May", revenue: 2_240_000_000, forecast: 2_150_000_000, cost: 1_310_000_000 },
];

export interface ActivityFeedItem {
  id: string;
  actorId: string;
  action: string;
  target: string;
  at: string;
  category: "delivery" | "sales" | "finance" | "support" | "people";
}

export const mockActivityFeed: ActivityFeedItem[] = [
  { id: "af-001", actorId: "tm-001", action: "resolved P0 incident", target: "GRD-T-1024 — Login latency spike", at: "2026-05-18T08:18:00Z", category: "support" },
  { id: "af-002", actorId: "tm-015", action: "advanced deal", target: "Galuh FinTech → Negotiation (IDR 2.7B)", at: "2026-05-18T07:55:00Z", category: "sales" },
  { id: "af-003", actorId: "tm-005", action: "approved invoice", target: "INV-2026-0048 (IDR 420M)", at: "2026-05-18T08:42:00Z", category: "finance" },
  { id: "af-004", actorId: "tm-014", action: "raised risk", target: "CDW-TMS now red", at: "2026-05-18T08:30:00Z", category: "delivery" },
  { id: "af-005", actorId: "tm-010", action: "shipped sprint", target: "Selasar EMR — Sprint 8", at: "2026-05-17T17:10:00Z", category: "delivery" },
  { id: "af-006", actorId: "tm-006", action: "closed UAT regressions", target: "Nusantara OMS", at: "2026-05-17T19:02:00Z", category: "delivery" },
  { id: "af-007", actorId: "tm-008", action: "started discovery", target: "Maritim Port Tracking", at: "2026-05-17T11:25:00Z", category: "delivery" },
];

export interface RiskAlert {
  id: string;
  level: "critical" | "high" | "medium";
  title: string;
  detail: string;
}

export const mockRiskAlerts: RiskAlert[] = [
  { id: "ra-001", level: "critical", title: "Jagat LMS budget breach", detail: "JGT-LMS cost has crossed 98% of budget with 38% progress." },
  { id: "ra-002", level: "high", title: "Cendrawasih TMS health", detail: "11 open tickets, 5 change requests, project flagged red." },
  { id: "ra-003", level: "high", title: "Rizky Pratama over-allocated", detail: "Allocation 115% across 3 active projects." },
  { id: "ra-004", level: "medium", title: "2 invoices > 14 days overdue", detail: "Cendrawasih + Jagat — total IDR 300M outstanding." },
];
