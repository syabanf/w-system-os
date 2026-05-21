"use client";

import type { TimesheetEntry } from "@/domain/entities/Timesheet";
import { mockTimesheet } from "@/infrastructure/data/timesheet.mock";
import { createCRUDStore } from "./createCRUDStore";

export type TimeEntryDraft = Omit<TimesheetEntry, "id">;

export const useTimesheetStore = createCRUDStore<TimesheetEntry, TimeEntryDraft>({
  storageKey: "wit-erp-os.timesheet",
  seed: mockTimesheet,
  idPrefix: "te",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});
