import type { Invoice } from "@/domain/entities/Invoice";

export const mockInvoices: Invoice[] = [
  { id: "inv-001", number: "INV-2026-0042", clientId: "cl-001", projectId: "prj-001", issueDate: "2026-04-01", dueDate: "2026-05-01", amount: 420_000_000, paidAmount: 420_000_000, status: "paid", currency: "IDR" },
  { id: "inv-002", number: "INV-2026-0048", clientId: "cl-001", projectId: "prj-001", issueDate: "2026-05-01", dueDate: "2026-05-31", amount: 420_000_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-003", number: "INV-2026-0049", clientId: "cl-002", projectId: "prj-002", issueDate: "2026-04-15", dueDate: "2026-05-15", amount: 280_000_000, paidAmount: 280_000_000, status: "paid", currency: "IDR" },
  { id: "inv-004", number: "INV-2026-0050", clientId: "cl-002", projectId: "prj-002", issueDate: "2026-05-12", dueDate: "2026-06-11", amount: 280_000_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-005", number: "INV-2026-0034", clientId: "cl-003", projectId: "prj-003", issueDate: "2026-03-22", dueDate: "2026-04-21", amount: 195_000_000, paidAmount: 0, status: "overdue", currency: "IDR" },
  { id: "inv-006", number: "INV-2026-0046", clientId: "cl-003", projectId: "prj-003", issueDate: "2026-04-22", dueDate: "2026-05-22", amount: 195_000_000, paidAmount: 0, status: "overdue", currency: "IDR" },
  { id: "inv-007", number: "INV-2026-0045", clientId: "cl-004", projectId: "prj-004", issueDate: "2026-04-25", dueDate: "2026-05-25", amount: 165_000_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-008", number: "INV-2026-0038", clientId: "cl-005", projectId: "prj-005", issueDate: "2026-04-10", dueDate: "2026-05-10", amount: 240_000_000, paidAmount: 240_000_000, status: "paid", currency: "IDR" },
  { id: "inv-009", number: "INV-2026-0047", clientId: "cl-005", projectId: "prj-005", issueDate: "2026-05-08", dueDate: "2026-06-07", amount: 240_000_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-010", number: "INV-2026-0031", clientId: "cl-007", projectId: "prj-007", issueDate: "2026-03-18", dueDate: "2026-04-17", amount: 180_000_000, paidAmount: 90_000_000, status: "overdue", currency: "IDR" },
  { id: "inv-011", number: "INV-2026-0040", clientId: "cl-008", projectId: "prj-008", issueDate: "2026-04-12", dueDate: "2026-05-12", amount: 110_000_000, paidAmount: 110_000_000, status: "paid", currency: "IDR" },
  { id: "inv-012", number: "INV-2026-0036", clientId: "cl-009", projectId: "prj-009", issueDate: "2026-04-05", dueDate: "2026-05-05", amount: 320_000_000, paidAmount: 320_000_000, status: "paid", currency: "IDR" },
  { id: "inv-013", number: "INV-2026-0051", clientId: "cl-009", projectId: "prj-009", issueDate: "2026-05-10", dueDate: "2026-06-09", amount: 320_000_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-014", number: "INV-2026-0030", clientId: "cl-011", projectId: "prj-011", issueDate: "2026-03-15", dueDate: "2026-04-14", amount: 95_000_000, paidAmount: 0, status: "overdue", currency: "IDR" },
  { id: "inv-015", number: "INV-2026-0044", clientId: "cl-012", projectId: "prj-012", issueDate: "2026-04-20", dueDate: "2026-05-20", amount: 145_000_000, paidAmount: 145_000_000, status: "paid", currency: "IDR" },
];
