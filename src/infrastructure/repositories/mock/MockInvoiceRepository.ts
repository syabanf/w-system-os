import type { InvoiceRepository } from "@/domain/repositories/InvoiceRepository";
import type { Invoice } from "@/domain/entities/Invoice";
import { mockInvoices } from "@/infrastructure/data/invoices.mock";

export class MockInvoiceRepository implements InvoiceRepository {
  async getAll(): Promise<Invoice[]> {
    return mockInvoices;
  }
  async getById(id: string): Promise<Invoice | null> {
    return mockInvoices.find((i) => i.id === id) ?? null;
  }
  async getOutstanding(): Promise<Invoice[]> {
    return mockInvoices.filter((i) => i.status === "sent" || i.status === "overdue");
  }
  async getOverdue(asOf: Date = new Date("2026-05-18T09:00:00Z")): Promise<Invoice[]> {
    return mockInvoices.filter(
      (i) => i.status === "overdue" || (i.status === "sent" && new Date(i.dueDate) < asOf),
    );
  }
}
