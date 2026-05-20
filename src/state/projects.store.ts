"use client";

import type { Project } from "@/domain/entities/Project";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { createCRUDStore } from "./createCRUDStore";

export type ProjectDraft = Omit<Project, "id" | "code"> & { code?: string };

let counter = mockProjects.length;
const nextCode = () => {
  counter += 1;
  return `P-${String(counter).padStart(4, "0")}`;
};

export const useProjectsStore = createCRUDStore<Project, ProjectDraft>({
  storageKey: "wit-erp-os.projects",
  seed: mockProjects,
  idPrefix: "pr",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    code: draft.code ?? nextCode(),
  }),
});
