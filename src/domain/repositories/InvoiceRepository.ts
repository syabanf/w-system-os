import type { Invoice } from "../entities/Invoice";

export interface InvoiceRepository {
  getAll(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  getOutstanding(): Promise<Invoice[]>;
  getOverdue(asOf?: Date): Promise<Invoice[]>;
}
