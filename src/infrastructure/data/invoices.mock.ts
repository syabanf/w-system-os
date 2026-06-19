import type { Invoice } from "@/domain/entities/Invoice";

export const mockInvoices: Invoice[] = [
  { id: "inv-001", number: "INV-2026-0042", clientId: "cl-001", projectId: "prj-001", issueDate: "2026-04-01", dueDate: "2026-05-01", amount: 418_500_000, paidAmount: 418_500_000, status: "paid", currency: "IDR" },
  { id: "inv-002", number: "INV-2026-0048", clientId: "cl-001", projectId: "prj-001", issueDate: "2026-05-01", dueDate: "2026-05-31", amount: 412_750_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-003", number: "INV-2026-0049", clientId: "cl-002", projectId: "prj-002", issueDate: "2026-04-15", dueDate: "2026-05-15", amount: 287_800_000, paidAmount: 287_800_000, status: "paid", currency: "IDR" },
  { id: "inv-004", number: "INV-2026-0050", clientId: "cl-002", projectId: "prj-002", issueDate: "2026-05-12", dueDate: "2026-06-11", amount: 274_300_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-005", number: "INV-2026-0034", clientId: "cl-003", projectId: "prj-003", issueDate: "2026-03-20", dueDate: "2026-04-19", amount: 198_300_000, paidAmount: 0, status: "overdue", currency: "IDR" },
  { id: "inv-006", number: "INV-2026-0046", clientId: "cl-003", projectId: "prj-003", issueDate: "2026-04-22", dueDate: "2026-05-22", amount: 192_600_000, paidAmount: 0, status: "overdue", currency: "IDR" },
  { id: "inv-007", number: "INV-2026-0045", clientId: "cl-004", projectId: "prj-004", issueDate: "2026-04-25", dueDate: "2026-05-25", amount: 163_900_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-008", number: "INV-2026-0038", clientId: "cl-005", projectId: "prj-005", issueDate: "2026-04-09", dueDate: "2026-05-09", amount: 241_650_000, paidAmount: 241_650_000, status: "paid", currency: "IDR" },
  { id: "inv-009", number: "INV-2026-0047", clientId: "cl-005", projectId: "prj-005", issueDate: "2026-05-08", dueDate: "2026-06-07", amount: 236_400_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-010", number: "INV-2026-0031", clientId: "cl-007", projectId: "prj-007", issueDate: "2026-03-18", dueDate: "2026-04-17", amount: 181_200_000, paidAmount: 84_600_000, status: "overdue", currency: "IDR" },
  { id: "inv-011", number: "INV-2026-0040", clientId: "cl-008", projectId: "prj-008", issueDate: "2026-04-12", dueDate: "2026-05-12", amount: 108_450_000, paidAmount: 108_450_000, status: "paid", currency: "IDR" },
  { id: "inv-012", number: "INV-2026-0036", clientId: "cl-009", projectId: "prj-009", issueDate: "2026-04-05", dueDate: "2026-05-05", amount: 322_900_000, paidAmount: 322_900_000, status: "paid", currency: "IDR" },
  { id: "inv-013", number: "INV-2026-0051", clientId: "cl-009", projectId: "prj-009", issueDate: "2026-05-10", dueDate: "2026-06-09", amount: 316_750_000, paidAmount: 0, status: "sent", currency: "IDR" },
  { id: "inv-014", number: "INV-2026-0030", clientId: "cl-011", projectId: "prj-011", issueDate: "2026-03-15", dueDate: "2026-04-14", amount: 93_700_000, paidAmount: 0, status: "overdue", currency: "IDR" },
  { id: "inv-015", number: "INV-2026-0044", clientId: "cl-012", projectId: "prj-012", issueDate: "2026-04-20", dueDate: "2026-05-20", amount: 146_850_000, paidAmount: 146_850_000, status: "paid", currency: "IDR" },
];
