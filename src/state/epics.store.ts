"use client";

import type { Epic } from "@/domain/entities/Epic";
import { mockEpics } from "@/infrastructure/data/epics.mock";
import { createCRUDStore } from "./createCRUDStore";

export type EpicDraft = Omit<Epic, "id" | "code"> & { code?: string };

let counter = mockEpics.length;
const nextCode = () => {
  counter += 1;
  return `EP-${String(counter).padStart(3, "0")}`;
};

export const useEpicsStore = createCRUDStore<Epic, EpicDraft>({
  storageKey: "wit-erp-os.epics",
  seed: mockEpics,
  idPrefix: "ep",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    code: draft.code ?? nextCode(),
  }),
});
