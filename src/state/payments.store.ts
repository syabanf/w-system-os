"use client";

import type { Payment } from "@/domain/entities/Transaction";
import { mockPayments } from "@/infrastructure/data/transactions.mock";
import { createCRUDStore } from "./createCRUDStore";

export type PaymentDraft = Omit<Payment, "id" | "number"> & { number?: string };

let counter = mockPayments.length;
const nextNumber = () => {
  counter += 1;
  return `PAY-${String(counter).padStart(4, "0")}`;
};

export const usePaymentsStore = createCRUDStore<Payment, PaymentDraft>({
  storageKey: "wit-erp-os.payments",
  seed: mockPayments,
  idPrefix: "pay",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    number: draft.number ?? nextNumber(),
  }),
});
