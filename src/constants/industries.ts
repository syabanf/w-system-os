import type { AppModuleId } from "./appModules";

/** An industry option offered in the setup wizard. Each maps to a recommended
 *  module set — the wizard's "AI suggestion" is this rule-based mapping
 *  (deterministic, no model call), surfaced as a smart starting point the user
 *  can still adjust. */
export interface Industry {
  id: string;
  label: string;
  recommended: AppModuleId[];
  /** One-line reason shown next to the suggestion. */
  rationale: string;
}

export const COMPANY_SIZES = ["Just me", "2–20", "21–100", "100+"] as const;

export const INDUSTRIES: Industry[] = [
  {
    id: "software",
    label: "Software & IT Services",
    recommended: ["dashboard", "leads", "clients", "projects", "support", "hr", "timesheet", "finance", "transaction", "knowledge"],
    rationale: "The full software-house loop: pipeline → delivery → billing, with support and a team wiki.",
  },
  {
    id: "consulting",
    label: "Consulting & Agency",
    recommended: ["dashboard", "leads", "clients", "projects", "timesheet", "finance", "transaction", "knowledge"],
    rationale: "Win work, run client projects, and bill by the hour — timesheets and invoicing up front.",
  },
  {
    id: "finance",
    label: "Finance & Banking",
    recommended: ["dashboard", "clients", "finance", "transaction", "kpis", "reports", "knowledge", "admin"],
    rationale: "Accounting, receivables, and KPI/board reporting, with tight access control.",
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    recommended: ["dashboard", "clients", "projects", "finance", "transaction", "hr", "timesheet", "support"],
    rationale: "Production projects and crews — costed, invoiced, and supported after the sale.",
  },
  {
    id: "retail",
    label: "Retail & E-commerce",
    recommended: ["dashboard", "clients", "leads", "transaction", "finance", "support", "kpis"],
    rationale: "Customers, orders, and revenue with a KPI scoreboard and a support desk.",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    recommended: ["dashboard", "clients", "hr", "support", "finance", "knowledge", "admin"],
    rationale: "Client accounts and staff, strong access control, and SOPs in the knowledge base.",
  },
  {
    id: "construction",
    label: "Construction & Property",
    recommended: ["dashboard", "clients", "projects", "finance", "transaction", "hr", "timesheet"],
    rationale: "Site projects and crews — progress-billed and time-tracked.",
  },
  {
    id: "education",
    label: "Education & Training",
    recommended: ["dashboard", "clients", "hr", "knowledge", "finance", "support", "portal"],
    rationale: "Learners and staff, a knowledge base, and a self-service portal.",
  },
  {
    id: "other",
    label: "Something else",
    recommended: ["dashboard", "leads", "clients", "projects", "support", "hr", "timesheet", "finance", "transaction", "knowledge"],
    rationale: "A balanced starter set across growth, delivery, people, and finance.",
  },
];

const FALLBACK = INDUSTRIES[INDUSTRIES.length - 1];

export function industryById(id: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

/** Recommended modules for an industry (falls back to the balanced set). */
export function recommendedFor(industryId: string): AppModuleId[] {
  return (industryById(industryId) ?? FALLBACK).recommended;
}
