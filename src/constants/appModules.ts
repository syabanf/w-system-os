import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Building2,
  Layers3,
  Hourglass,
  Landmark,
  LifeBuoy,
  Library,
  KeyRound,
  Flame,
  ContactRound,
  ArrowLeftRight,
  SquareUser,
  FileBarChart,
  Target,
  Sparkles,
} from "lucide-react";

export type AppModuleId =
  | "dashboard"
  | "leads"
  | "clients"
  | "projects"
  | "hr"
  | "timesheet"
  | "support"
  | "finance"
  | "transaction"
  | "knowledge"
  | "admin"
  | "portal"
  | "reports"
  | "kpis"
  | "performance";

export interface AppModule {
  id: AppModuleId;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  /** Pastel accent — readable on a dark icon tile (dark mode). */
  accent: string;
  /** Saturated counterpart — readable on a light icon tile (light mode). */
  accentLight: string;
  group: "executive" | "growth" | "delivery" | "operations" | "finance" | "system";
}

// Module order tuned so dock reads as: exec → growth → delivery → ops → finance → system.
export const APP_MODULES: AppModule[] = [
  { id: "dashboard", name: "Executive Dashboard", shortName: "Dashboard", description: "Firm-wide pulse for leadership and PMO.", icon: Compass, accent: "#FAFAF9", accentLight: "#475569", group: "executive" },
  { id: "kpis", name: "KPIs & Targets", shortName: "KPIs", description: "Live KPI scoreboard with trend, target floor, and status.", icon: Target, accent: "#BAE6FD", accentLight: "#0369A1", group: "executive" },
  { id: "reports", name: "Reports", shortName: "Reports", description: "Report library, recent runs, and scheduled deliveries.", icon: FileBarChart, accent: "#A5F3FC", accentLight: "#0E7490", group: "executive" },
  { id: "leads", name: "Sales & Pipeline", shortName: "Sales", description: "Leads, scoring, sales kanban, and project commercial.", icon: Flame, accent: "#FBCFE8", accentLight: "#BE185D", group: "growth" },
  { id: "clients", name: "Client Management", shortName: "Clients", description: "Accounts, health, renewal & communication.", icon: Building2, accent: "#A7F3D0", accentLight: "#047857", group: "growth" },
  { id: "projects", name: "Projects & Sprints", shortName: "Projects", description: "Portfolio + sprint board, backlog, velocity, burndown.", icon: Layers3, accent: "#FDE68A", accentLight: "#B45309", group: "delivery" },
  { id: "support", name: "Support & Change Requests", shortName: "Support", description: "Tickets, SLA, change request impact.", icon: LifeBuoy, accent: "#FED7AA", accentLight: "#C2410C", group: "delivery" },
  { id: "hr", name: "People & Operations", shortName: "People", description: "Employees, attendance, leave, payroll, capacity, contracts.", icon: ContactRound, accent: "#FBCFE8", accentLight: "#A21CAF", group: "operations" },
  { id: "performance", name: "Performance 360", shortName: "Performance", description: "360-degree review templates, submissions and dashboards.", icon: Sparkles, accent: "#FDE2A8", accentLight: "#9D174D", group: "operations" },
  { id: "portal", name: "User Portal", shortName: "Portal", description: "Self-service: check-in, onboarding, chat, leave, HR meetings.", icon: SquareUser, accent: "#C7D2FE", accentLight: "#4338CA", group: "operations" },
  { id: "timesheet", name: "Timesheet & Productivity", shortName: "Timesheets", description: "Hours, billability, approvals.", icon: Hourglass, accent: "#BBF7D0", accentLight: "#15803D", group: "operations" },
  { id: "finance", name: "Finance & Accounting", shortName: "Finance", description: "GL, journals, P&L, cashflow, billing, termin schedule.", icon: Landmark, accent: "#FEF3C7", accentLight: "#A16207", group: "finance" },
  { id: "transaction", name: "Transactions", shortName: "Transactions", description: "Invoices, payments, POs, expense claims.", icon: ArrowLeftRight, accent: "#FECACA", accentLight: "#B91C1C", group: "finance" },
  { id: "knowledge", name: "Knowledge Base", shortName: "Wiki", description: "SOPs, templates, tech standards.", icon: Library, accent: "#DDD6FE", accentLight: "#6D28D9", group: "system" },
  { id: "admin", name: "Identity & Access", shortName: "Admin", description: "Users, roles, permissions, sessions, audit.", icon: KeyRound, accent: "#E5E7EB", accentLight: "#52525B", group: "system" },
];

export const APP_MODULE_MAP: Record<AppModuleId, AppModule> = APP_MODULES.reduce(
  (acc, m) => ({ ...acc, [m.id]: m }),
  {} as Record<AppModuleId, AppModule>,
);
