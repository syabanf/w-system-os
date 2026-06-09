"use client";

import type { PurchaseOrder } from "@/domain/entities/Transaction";
import { mockPurchaseOrders } from "@/infrastructure/data/transactions.mock";
import { DEMO_YEAR } from "@/lib/date";
import { createCRUDStore } from "./createCRUDStore";

export type PurchaseOrderDraft = Omit<PurchaseOrder, "id" | "number"> & { number?: string };

let counter = mockPurchaseOrders.length;
const nextNumber = () => {
  counter += 1;
  return `PO-${DEMO_YEAR}-${String(counter).padStart(4, "0")}`;
};

export const usePurchaseOrdersStore = createCRUDStore<PurchaseOrder, PurchaseOrderDraft>({
  storageKey: "wit-erp-os.purchaseOrders",
  seed: mockPurchaseOrders,
  idPrefix: "po",
  fromDraft: (draft, { id }) => ({
    ...draft,
    id,
    number: draft.number ?? nextNumber(),
  }),
});
