"use client";

import { mockKnowledge, type KnowledgeArticle } from "@/infrastructure/data/knowledge.mock";
import { createCRUDStore } from "./createCRUDStore";

export type KnowledgeDraft = Omit<KnowledgeArticle, "id" | "updatedAt"> & {
  updatedAt?: string;
};

export const useKnowledgeStore = createCRUDStore<KnowledgeArticle, KnowledgeDraft>({
  storageKey: "wit-erp-os.knowledge",
  seed: mockKnowledge,
  idPrefix: "kb",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    updatedAt: draft.updatedAt ?? new Date().toISOString().slice(0, 10),
  }),
  applyPatch: (existing, patch) => ({
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString().slice(0, 10),
  }),
});
