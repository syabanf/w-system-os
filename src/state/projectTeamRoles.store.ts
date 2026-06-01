"use client";

import { useMemo } from "react";
import type { ProjectTeamRole } from "@/domain/entities/ProjectTeamRole";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { createCRUDStore } from "./createCRUDStore";

export type ProjectTeamRoleDraft = Omit<ProjectTeamRole, "id">;

/** Deterministic phone number derived from initials/index so seed stays stable
 *  without polluting the TeamMember entity with phone-on-disk data. */
function seedPhone(index: number): string {
  const base = 81200000000 + index * 137; // arbitrary spread
  return `+62${base.toString().slice(0, 11)}`;
}

function buildSeed(): ProjectTeamRole[] {
  const rows: ProjectTeamRole[] = [];
  const members = mockTeam.slice(0, 5);
  for (const project of mockProjects) {
    members.forEach((m, idx) => {
      rows.push({
        id: `ptr-${project.id}-${m.id}`,
        projectId: project.id,
        name: m.name,
        role: m.role,
        phone: seedPhone(idx),
        email: m.email,
      });
    });
  }
  return rows;
}

const seed = buildSeed();

export const useProjectTeamRolesStore = createCRUDStore<
  ProjectTeamRole,
  ProjectTeamRoleDraft
>({
  storageKey: "wit-erp-os.projectTeamRoles",
  seed,
  idPrefix: "ptr",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});

export function useProjectTeamRoles(projectId: string): ProjectTeamRole[] {
  const items = useProjectTeamRolesStore((s) => s.items);
  return useMemo(
    () => items.filter((r) => r.projectId === projectId),
    [items, projectId],
  );
}
