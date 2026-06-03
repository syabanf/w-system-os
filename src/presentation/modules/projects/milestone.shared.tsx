import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import type {
  MilestoneSection,
  MilestoneStatus,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { Avatar } from "@/presentation/shared/Avatar";
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
        "ms-pill shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1",
        STATUS_PILL[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Long, human date for the expanded detail panel (e.g. "Tue, 02 June 2026"). */
export function formatMilestoneDateLong(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Resolve a milestone's owner to the firm-wide team directory. */
export function resolveMilestoneOwner(ownerId?: string) {
  if (!ownerId) return null;
  return mockTeam.find((m) => m.id === ownerId) ?? null;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="whitespace-nowrap pt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </dt>
      <dd className="min-w-0 text-[11px] text-zinc-200">{children}</dd>
    </>
  );
}

/**
 * Fully-expanded "detailed items" view of a single milestone — surfaces every
 * field the summary row hides (owner/PIC, full due date, drive link, reference
 * slug, notes). Shared by the board rows and the table's expandable rows so the
 * two stay byte-for-byte identical.
 */
export function MilestoneDetail({ milestone }: { milestone: ProjectMilestone }) {
  const owner = resolveMilestoneOwner(milestone.ownerId);
  return (
    <dl className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2.5">
      <DetailRow label="Owner / PIC">
        {owner ? (
          <span className="inline-flex items-center gap-1.5">
            <Avatar
              name={owner.name}
              initials={owner.initials}
              size="sm"
              color={owner.avatarColor}
            />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-medium text-zinc-100">
                {owner.name}
              </span>
              <span className="block truncate text-[10px] text-zinc-400">
                {owner.role}
              </span>
            </span>
          </span>
        ) : (
          <span className="text-zinc-500">Unassigned</span>
        )}
      </DetailRow>

      <DetailRow label="Section">{SECTION_TITLE[milestone.section]}</DetailRow>

      <DetailRow label="Status">
        <StatusPill status={milestone.status} />
      </DetailRow>

      <DetailRow label="Due date">
        {formatMilestoneDateLong(milestone.dueDate)}
      </DetailRow>

      <DetailRow label="Drive link">
        {milestone.driveLink ? (
          <a
            href={milestone.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sky-300 hover:underline"
          >
            <span className="truncate">Open document</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
          </a>
        ) : (
          <span className="text-zinc-500">—</span>
        )}
      </DetailRow>

      <DetailRow label="Reference">
        <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
          {milestone.kind}
        </code>
      </DetailRow>

      <DetailRow label="Notes">
        {milestone.notes ? (
          <span className="whitespace-pre-line text-zinc-300">
            {milestone.notes}
          </span>
        ) : (
          <span className="text-zinc-500">No notes added.</span>
        )}
      </DetailRow>
    </dl>
  );
}
