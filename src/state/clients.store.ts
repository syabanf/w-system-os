"use client";

import { mockClients } from "@/infrastructure/data/clients.mock";
import type { Client } from "@/domain/entities/Client";
import { demoNowISO } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type ClientDraft = Omit<Client, "id" | "joinedAt"> & { joinedAt?: string };

export const useClientsStore = createCRUDStore<Client, ClientDraft>({
  storageKey: "wit-erp-os.clients",
  seed: mockClients,
  idPrefix: "cl",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    joinedAt: draft.joinedAt ?? demoNowISO(),
  }),
});
