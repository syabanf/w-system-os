"use client";

import { useMemo } from "react";
import type {
  MilestoneSection,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import { mockProjects } from "@/infrastructure/data/projects.mock";
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
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
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
          status: "waiting-action",
          dueDate: seedDueDate(project.id, entry.kind),
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
  storageKey: "wit-erp-os.milestones",
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
