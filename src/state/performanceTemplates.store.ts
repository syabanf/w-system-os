"use client";

import {
  mockPerformanceTemplates,
  type Performance360Template,
} from "@/infrastructure/data/performance360.mock";
import { createCRUDStore } from "./createCRUDStore";

export type PerformanceTemplateDraft = Omit<
  Performance360Template,
  "id" | "createdAt"
> & { createdAt?: string };

export const usePerformanceTemplatesStore = createCRUDStore<
  Performance360Template,
  PerformanceTemplateDraft
>({
  storageKey: "wit-erp-os.performance-templates",
  seed: mockPerformanceTemplates,
  idPrefix: "t360",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    createdAt: draft.createdAt ?? new Date().toISOString().slice(0, 10),
  }),
});
