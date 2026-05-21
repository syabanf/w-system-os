"use client";

import type { Sprint } from "@/domain/entities/Sprint";
import { mockSprints } from "@/infrastructure/data/tasks.mock";
import { createCRUDStore } from "./createCRUDStore";

export type SprintDraft = Omit<Sprint, "id">;

export const useSprintsStore = createCRUDStore<Sprint, SprintDraft>({
  storageKey: "wit-erp-os.sprints",
  seed: mockSprints,
  idPrefix: "sp",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});
