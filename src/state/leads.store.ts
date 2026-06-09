"use client";

import { mockLeads } from "@/infrastructure/data/leads.mock";
import type { Lead } from "@/domain/entities/Lead";
import { demoNowISO } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type LeadDraft = Omit<Lead, "id" | "createdAt"> & { createdAt?: string };

export const useLeadsStore = createCRUDStore<Lead, LeadDraft>({
  storageKey: "wit-erp-os.leads",
  seed: mockLeads,
  idPrefix: "ld",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    createdAt: draft.createdAt ?? demoNowISO(),
  }),
});
