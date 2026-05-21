"use client";

import type { Invoice } from "@/domain/entities/Invoice";
import { mockInvoices } from "@/infrastructure/data/invoices.mock";
import { createCRUDStore } from "./createCRUDStore";

export type InvoiceDraft = Omit<Invoice, "id" | "number"> & { number?: string };

let counter = mockInvoices.length;
const nextNumber = () => {
  counter += 1;
  return `INV-${new Date().getFullYear()}-${String(counter).padStart(4, "0")}`;
};

export const useInvoicesStore = createCRUDStore<Invoice, InvoiceDraft>({
  storageKey: "wit-erp-os.invoices",
  seed: mockInvoices,
  idPrefix: "inv",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    number: draft.number ?? nextNumber(),
  }),
});
