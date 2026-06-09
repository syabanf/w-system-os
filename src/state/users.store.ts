"use client";

import type { UserAccount } from "@/domain/entities/User";
import { mockUsers } from "@/infrastructure/data/users.mock";
import { demoNowISO } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type UserDraft = Omit<UserAccount, "id" | "lastLogin"> & { lastLogin?: string };

export const useUsersStore = createCRUDStore<UserAccount, UserDraft>({
  storageKey: "wit-erp-os.users",
  seed: mockUsers,
  idPrefix: "ua",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    lastLogin: draft.lastLogin ?? demoNowISO(),
  }),
});
