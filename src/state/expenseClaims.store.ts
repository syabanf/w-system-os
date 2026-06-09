"use client";

import type { ExpenseClaim } from "@/domain/entities/Transaction";
import { mockExpenseClaims } from "@/infrastructure/data/transactions.mock";
import { DEMO_YEAR } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type ExpenseClaimDraft = Omit<ExpenseClaim, "id" | "number"> & { number?: string };

let counter = mockExpenseClaims.length;
const nextNumber = () => {
  counter += 1;
  return `EXP-${DEMO_YEAR}-${String(counter).padStart(4, "0")}`;
};

export const useExpenseClaimsStore = createCRUDStore<ExpenseClaim, ExpenseClaimDraft>({
  storageKey: "wit-erp-os.expenseClaims",
  seed: mockExpenseClaims,
  idPrefix: "exp",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    number: draft.number ?? nextNumber(),
  }),
});
