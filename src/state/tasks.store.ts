"use client";

import type { Task } from "@/domain/entities/Task";
import { mockTasks } from "@/infrastructure/data/tasks.mock";
import { createCRUDStore } from "./createCRUDStore";

export type TaskDraft = Omit<Task, "id" | "code" | "createdAt"> & {
  code?: string;
  createdAt?: string;
};

let counter = mockTasks.length;
const nextCode = () => {
  counter += 1;
  return `T-${String(counter).padStart(4, "0")}`;
};

export const useTasksStore = createCRUDStore<Task, TaskDraft>({
  storageKey: "wit-erp-os.tasks",
  seed: mockTasks,
  idPrefix: "tk",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    code: draft.code ?? nextCode(),
    createdAt: draft.createdAt ?? new Date().toISOString(),
  }),
});
