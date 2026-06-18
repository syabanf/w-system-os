"use client";

import type { Quotation } from "@/domain/entities/Quotation";
import { mockQuotations } from "@/infrastructure/data/quotations.mock";
import { DEMO_YEAR } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type QuotationDraft = Omit<Quotation, "id" | "number"> & {
  number?: string;
};

let counter = mockQuotations.length;
const nextNumber = () => {
  counter += 1;
  return `QUO-${DEMO_YEAR}-${String(counter).padStart(4, "0")}`;
};

export const useQuotationsStore = createCRUDStore<Quotation, QuotationDraft>({
  storageKey: "wit-erp-os.quotations",
  seed: mockQuotations,
  idPrefix: "qt",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    number: draft.number ?? nextNumber(),
  }),
});
