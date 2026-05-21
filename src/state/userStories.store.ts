"use client";

import type { UserStory } from "@/domain/entities/UserStory";
import { mockUserStories } from "@/infrastructure/data/epics.mock";
import { createCRUDStore } from "./createCRUDStore";

export type UserStoryDraft = Omit<UserStory, "id" | "code"> & { code?: string };

let counter = mockUserStories.length;
const nextCode = () => {
  counter += 1;
  return `US-${String(counter).padStart(3, "0")}`;
};

export const useUserStoriesStore = createCRUDStore<UserStory, UserStoryDraft>({
  storageKey: "wit-erp-os.userStories",
  seed: mockUserStories,
  idPrefix: "us",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    code: draft.code ?? nextCode(),
  }),
});
