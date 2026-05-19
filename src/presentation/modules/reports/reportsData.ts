export type Category = "Finance" | "Sales" | "Projects" | "People" | "Operations" | "Executive";

export interface ReportTemplate {
  id: string;
  name: string;
  category: Category;
  description: string;
  format: "PDF" | "Excel" | "CSV";
  cadence: "On-demand" | "Daily" | "Weekly" | "Monthly" | "Quarterly";
  lastRun?: string;
}

export interface RunHistoryItem {
  id: string;
  templateId: string;
  templateName: string;
  category: Category;
  ranAt: string;
  ranBy: string;
  duration: string;
  status: "completed" | "running" | "failed";
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  templateName: string;
  recipients: string[];
  cadence: ReportTemplate["cadence"];
  nextRun: string;
  channel: "Email" | "Slack" | "Dashboard";
  paused?: boolean;
}

export const TEMPLATES: ReportTemplate[] = [
  { id: "rep-001", name: "P&L Statement", category: "Finance", description: "GL-derived income statement with month-over-month variance.", format: "PDF", cadence: "Monthly", lastRun: "2026-05-01" },
  { id: "rep-002", name: "Cashflow Forecast", category: "Finance", description: "13-week rolling cashflow with AR/AP aging buckets.", format: "Excel", cadence: "Weekly", lastRun: "2026-05-13" },
  { id: "rep-003", name: "Outstanding Invoices", category: "Finance", description: "Aged receivables by client and project.", format: "Excel", cadence: "Weekly", lastRun: "2026-05-13" },
  { id: "rep-004", name: "Sales Pipeline Forecast", category: "Sales", description: "Weighted pipeline by stage and source, with conversion benchmarks.", format: "PDF", cadence: "Weekly", lastRun: "2026-05-12" },
  { id: "rep-005", name: "Win/Loss Analysis", category: "Sales", description: "Closed deals broken down by reason, source, and segment.", format: "PDF", cadence: "Monthly", lastRun: "2026-05-01" },
  { id: "rep-006", name: "Project Health Snapshot", category: "Projects", description: "Margin, progress, risk and ticket count for every active project.", format: "PDF", cadence: "Weekly", lastRun: "2026-05-13" },
  { id: "rep-007", name: "Sprint Velocity Trends", category: "Projects", description: "Rolling 6-sprint velocity per team with committed vs delivered points.", format: "Excel", cadence: "Monthly", lastRun: "2026-05-01" },
  { id: "rep-008", name: "Resource Utilization", category: "Operations", description: "Allocation, billable %, and over-allocation per engineer.", format: "Excel", cadence: "Weekly", lastRun: "2026-05-13" },
  { id: "rep-009", name: "Headcount Movement", category: "People", description: "Joiners, leavers, transfers and end-of-period FTE per department.", format: "PDF", cadence: "Monthly", lastRun: "2026-05-01" },
  { id: "rep-010", name: "Payroll Register", category: "People", description: "Gross-to-net per employee for the current run, with PPh 21 and BPJS.", format: "Excel", cadence: "Monthly", lastRun: "2026-05-15" },
  { id: "rep-011", name: "SLA Compliance", category: "Operations", description: "Breach rate by severity and client, with average resolution time.", format: "PDF", cadence: "Monthly", lastRun: "2026-05-01" },
  { id: "rep-012", name: "Board Pack", category: "Executive", description: "Quarterly summary across revenue, delivery, pipeline and risk.", format: "PDF", cadence: "Quarterly", lastRun: "2026-04-01" },
];

export const RECENT_RUNS: RunHistoryItem[] = [
  { id: "run-001", templateId: "rep-002", templateName: "Cashflow Forecast", category: "Finance", ranAt: "2026-05-19 08:14", ranBy: "Damar Wicaksono", duration: "12s", status: "completed" },
  { id: "run-002", templateId: "rep-008", templateName: "Resource Utilization", category: "Operations", ranAt: "2026-05-19 08:02", ranBy: "Citra Anggraini", duration: "9s", status: "completed" },
  { id: "run-003", templateId: "rep-006", templateName: "Project Health Snapshot", category: "Projects", ranAt: "2026-05-18 17:31", ranBy: "Damar Wicaksono", duration: "21s", status: "completed" },
  { id: "run-004", templateId: "rep-004", templateName: "Sales Pipeline Forecast", category: "Sales", ranAt: "2026-05-18 11:00", ranBy: "Scheduler", duration: "—", status: "running" },
  { id: "run-005", templateId: "rep-003", templateName: "Outstanding Invoices", category: "Finance", ranAt: "2026-05-18 09:11", ranBy: "Bagas Adhitya", duration: "—", status: "failed" },
  { id: "run-006", templateId: "rep-007", templateName: "Sprint Velocity Trends", category: "Projects", ranAt: "2026-05-17 14:42", ranBy: "Rizky Pratama", duration: "16s", status: "completed" },
  { id: "run-007", templateId: "rep-002", templateName: "Cashflow Forecast", category: "Finance", ranAt: "2026-05-12 07:00", ranBy: "Scheduler", duration: "11s", status: "completed" },
  { id: "run-008", templateId: "rep-002", templateName: "Cashflow Forecast", category: "Finance", ranAt: "2026-05-05 07:00", ranBy: "Scheduler", duration: "13s", status: "completed" },
  { id: "run-009", templateId: "rep-006", templateName: "Project Health Snapshot", category: "Projects", ranAt: "2026-05-12 08:00", ranBy: "Scheduler", duration: "18s", status: "completed" },
];

export const SCHEDULED: ScheduledReport[] = [
  { id: "sch-001", templateId: "rep-002", templateName: "Cashflow Forecast", recipients: ["cfo@wit.id", "finance@wit.id"], cadence: "Weekly", nextRun: "2026-05-20 07:00", channel: "Email" },
  { id: "sch-002", templateId: "rep-006", templateName: "Project Health Snapshot", recipients: ["leadership@wit.id"], cadence: "Weekly", nextRun: "2026-05-20 08:00", channel: "Email" },
  { id: "sch-003", templateId: "rep-008", templateName: "Resource Utilization", recipients: ["#ops-weekly"], cadence: "Weekly", nextRun: "2026-05-20 09:00", channel: "Slack" },
  { id: "sch-004", templateId: "rep-012", templateName: "Board Pack", recipients: ["board@wit.id"], cadence: "Quarterly", nextRun: "2026-07-01 06:00", channel: "Email" },
  { id: "sch-005", templateId: "rep-010", templateName: "Payroll Register", recipients: ["hr@wit.id", "accounting@wit.id"], cadence: "Monthly", nextRun: "2026-06-15 06:00", channel: "Email", paused: true },
];

export const CATEGORY_TONE: Record<Category, string> = {
  Finance: "#FBBF24",
  Sales: "#FBCFE8",
  Projects: "#FDE68A",
  People: "#A7F3D0",
  Operations: "#C7D2FE",
  Executive: "#FAFAF9",
};
