import type { Invoice } from "@/domain/entities/Invoice";

export const InvoiceMapper = {
  fromRaw(raw: unknown): Invoice {
    return raw as Invoice;
  },
  toRaw(invoice: Invoice): unknown {
    return invoice;
  },
};
