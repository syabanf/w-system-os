"use client";

import { useMemo } from "react";
import type {
  MilestoneSection,
  MilestoneStatus,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { demoNow } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type ProjectMilestoneDraft = Omit<ProjectMilestone, "id">;

/** Canonical milestone rows per section. The `kind` is the stable slug used
 *  to derive the seed ID (`ms-${projectId}-${kind}`) so reseeding doesn't
 *  duplicate rows. */
export const MILESTONE_CATALOG: Record<
  MilestoneSection,
  ReadonlyArray<{ kind: string; label: string }>
> = {
  workflow: [
    { kind: "project-brief", label: "Project Brief" },
    { kind: "project-report", label: "Project Report" },
    { kind: "project-link-demo", label: "Project Link & Demo" },
    { kind: "kick-off", label: "Kick Off" },
    { kind: "weekly-meeting", label: "Weekly Meeting" },
    { kind: "quotation-deck", label: "Quotation/Deck" },
    { kind: "nda", label: "NDA" },
  ],
  payment: [
    { kind: "down-payment", label: "Down Payment" },
    { kind: "terms-1", label: "Terms 1" },
    { kind: "terms-2", label: "Terms 2" },
    { kind: "terms-3", label: "Terms 3" },
    { kind: "retention", label: "Retention" },
    { kind: "final-payment", label: "Final Payment" },
  ],
  credential: [
    { kind: "summary-quotation", label: "Summary Quotation" },
    { kind: "mou-pks", label: "MOU/PKS" },
    { kind: "first-payment", label: "First Payment" },
  ],
  development: [
    { kind: "user-requirement", label: "User Requirement" },
    { kind: "brd", label: "BRD" },
    { kind: "fsd", label: "FSD" },
    { kind: "tsd", label: "TSD" },
    { kind: "asset-repository", label: "Asset Repository" },
    { kind: "minute-of-meeting", label: "Minute of Meeting" },
    { kind: "weekly-report", label: "Weekly Report" },
    { kind: "uat-sit", label: "UAT/SIT" },
    { kind: "bast", label: "BAST" },
  ],
};

export const MILESTONE_SECTIONS: ReadonlyArray<MilestoneSection> = [
  "workflow",
  "payment",
  "credential",
  "development",
];

/** Tiny deterministic PRNG so the seeded due dates stay stable across runs. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedDueDate(projectId: string, kind: string): string {
  const offsetDays = hashSeed(`${projectId}:${kind}`) % 60; // 0..59
  const d = demoNow();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Weighted spread so a freshly-seeded project reads like real work in motion
 *  rather than a wall of "waiting action". */
const STATUS_POOL: ReadonlyArray<MilestoneStatus> = [
  "approved",
  "approved",
  "already-sent",
  "in-progress",
  "in-progress",
  "waiting-action",
  "waiting-action",
  "overdue",
];

function seedStatus(projectId: string, kind: string): MilestoneStatus {
  return STATUS_POOL[hashSeed(`${projectId}:${kind}:status`) % STATUS_POOL.length];
}

function seedOwnerId(projectId: string, kind: string): string {
  const member = mockTeam[hashSeed(`${projectId}:${kind}:owner`) % mockTeam.length];
  return member.id;
}

/** Short, plausible PM notes. ~⅗ of milestones get one; the rest stay blank so
 *  the detail panel also exercises its empty state. */
const NOTE_SNIPPETS: ReadonlyArray<string> = [
  "Awaiting client sign-off before we can mark this complete.",
  "Shared with stakeholders — pending feedback in the next sync.",
  "Blocked on the vendor API credentials; escalated to the PM.",
  "Draft reviewed internally; minor revisions requested.",
  "On track. Final copy to be attached to the drive folder.",
  "Dependency on the previous milestone resolved last week.",
];

function seedNotes(projectId: string, kind: string): string | undefined {
  const h = hashSeed(`${projectId}:${kind}:notes`);
  if (h % 5 < 2) return undefined; // ~40% have no notes
  return NOTE_SNIPPETS[h % NOTE_SNIPPETS.length];
}

function seedDriveLink(projectId: string, kind: string): string | undefined {
  const h = hashSeed(`${projectId}:${kind}:drive`);
  if (h % 2 === 0) return undefined; // ~half link to a document
  return `https://drive.google.com/drive/folders/${projectId}-${kind}`;
}

function buildSeed(): ProjectMilestone[] {
  const rows: ProjectMilestone[] = [];
  for (const project of mockProjects) {
    for (const section of MILESTONE_SECTIONS) {
      for (const entry of MILESTONE_CATALOG[section]) {
        rows.push({
          id: `ms-${project.id}-${entry.kind}`,
          projectId: project.id,
          section,
          kind: entry.kind,
          label: entry.label,
          status: seedStatus(project.id, entry.kind),
          dueDate: seedDueDate(project.id, entry.kind),
          ownerId: seedOwnerId(project.id, entry.kind),
          notes: seedNotes(project.id, entry.kind),
          driveLink: seedDriveLink(project.id, entry.kind),
        });
      }
    }
  }
  return rows;
}

const seed = buildSeed();

export const useMilestonesStore = createCRUDStore<
  ProjectMilestone,
  ProjectMilestoneDraft
>({
  // v2: seed now carries owner / status / notes / drive link for the
  // expandable detail panel. Bumped so existing demos re-seed with the richer
  // data instead of showing the older bare rows.
  storageKey: "wit-erp-os.milestones.v2",
  seed,
  idPrefix: "ms",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});

/** Memoized selector for one project's milestones. Zustand selectors can't
 *  natively memo array filters across renders, so we filter in a `useMemo`. */
export function useProjectMilestones(projectId: string): ProjectMilestone[] {
  const items = useMilestonesStore((s) => s.items);
  return useMemo(
    () => items.filter((m) => m.projectId === projectId),
    [items, projectId],
  );
}
