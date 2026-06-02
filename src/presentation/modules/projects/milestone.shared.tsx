import type {
  MilestoneSection,
  MilestoneStatus,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import { cn } from "@/lib/cn";

/**
 * Shared vocabulary for the project-milestone views (board, table, calendar).
 *
 * Milestones split into two business-facing categories:
 *  - **Technical** — execution & engineering artefacts (workflow, development).
 *  - **Commercial** — money & contracts (payment, credential).
 *
 * Keeping these maps in one module lets the board, the table (with its
 * Technical/Commercial tabs) and the calendar stay perfectly in sync.
 */
export type MilestoneCategory = "technical" | "commercial";

export const MILESTONE_CATEGORY: Record<MilestoneSection, MilestoneCategory> = {
  workflow: "technical",
  development: "technical",
  payment: "commercial",
  credential: "commercial",
};

export const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  technical: "Technical",
  commercial: "Commercial",
};

/** Accent hue per category — reused for bands, dots and calendar markers. */
export const CATEGORY_ACCENT: Record<MilestoneCategory, string> = {
  technical: "#60A5FA", // sky
  commercial: "#F59E0B", // amber
};

/** Which milestone sections roll up under each category (ordered). */
export const CATEGORY_SECTIONS: Record<MilestoneCategory, MilestoneSection[]> = {
  technical: ["workflow", "development"],
  commercial: ["payment", "credential"],
};

export const CATEGORY_ORDER: ReadonlyArray<MilestoneCategory> = [
  "technical",
  "commercial",
];

export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  "waiting-action": "Waiting action",
  "already-sent": "Already sent",
  "in-progress": "In progress",
  approved: "Approved",
  overdue: "Overdue",
};

/** Inline pill styling. Milestone-specific palette (incl. the "mint"
 *  already-sent hue) so we don't lean on the generic StatusBadge. */
export const STATUS_PILL: Record<MilestoneStatus, string> = {
  "waiting-action": "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  "already-sent": "bg-teal-500/15 text-teal-200 ring-teal-400/30",
  "in-progress": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  overdue: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export const SECTION_TITLE: Record<MilestoneSection, string> = {
  workflow: "Workflow",
  payment: "Payment Progress",
  credential: "Credential Data",
  development: "Development Data",
};

/** Completion = (approved + already-sent) / total. Anything shipped or filed
 *  counts as "progressed" for the bar, even if not yet approved. */
export function progressOf(items: ProjectMilestone[]): number {
  if (items.length === 0) return 0;
  const done = items.filter(
    (i) => i.status === "approved" || i.status === "already-sent",
  ).length;
  return Math.round((done / items.length) * 100);
}

export function formatMilestoneDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function StatusPill({ status }: { status: MilestoneStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1",
        STATUS_PILL[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
