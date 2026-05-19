import type { Payment, PurchaseOrder, ExpenseClaim } from "@/domain/entities/Transaction";

export const mockPayments: Payment[] = [
  { id: "py-001", number: "PAY-2026-0118", type: "incoming", date: "2026-05-18", amount: 420_000_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "INV-2026-0042", clientId: "cl-001", appliedToInvoiceId: "inv-001", status: "cleared" },
  { id: "py-002", number: "PAY-2026-0119", type: "incoming", date: "2026-05-17", amount: 280_000_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "INV-2026-0049", clientId: "cl-002", appliedToInvoiceId: "inv-003", status: "cleared" },
  { id: "py-003", number: "PAY-2026-0120", type: "incoming", date: "2026-05-15", amount: 240_000_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "INV-2026-0038", clientId: "cl-005", appliedToInvoiceId: "inv-008", status: "cleared" },
  { id: "py-004", number: "PAY-2026-0121", type: "incoming", date: "2026-05-15", amount: 320_000_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "INV-2026-0036", clientId: "cl-009", appliedToInvoiceId: "inv-012", status: "cleared" },
  { id: "py-005", number: "PAY-2026-0122", type: "incoming", date: "2026-05-12", amount: 110_000_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "INV-2026-0040", clientId: "cl-008", appliedToInvoiceId: "inv-011", status: "cleared" },
  { id: "py-006", number: "PAY-2026-0123", type: "incoming", date: "2026-05-08", amount: 145_000_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "INV-2026-0044", clientId: "cl-012", appliedToInvoiceId: "inv-015", status: "cleared" },
  { id: "py-007", number: "PAY-2026-0098", type: "outgoing", date: "2026-05-15", amount: 38_500_000, method: "Bank Transfer", bankAccount: "BCA · WIT Operating", reference: "AWS-2026-05", vendor: "Amazon Web Services SG", status: "cleared", notes: "May 2026 cloud infra" },
  { id: "py-008", number: "PAY-2026-0099", type: "outgoing", date: "2026-05-12", amount: 12_750_000, method: "Bank Transfer", bankAccount: "BCA · WIT Payroll", reference: "Office rent May", vendor: "PT. Wisma Mulia Jakarta", status: "cleared" },
  { id: "py-009", number: "PAY-2026-0100", type: "outgoing", date: "2026-05-18", amount: 6_200_000, method: "E-Wallet", bankAccount: "GoPay · ops", reference: "Figma Org", vendor: "Figma Inc.", status: "draft" },
  { id: "py-010", number: "PAY-2026-0101", type: "outgoing", date: "2026-05-10", amount: 4_900_000, method: "Card", bankAccount: "BCA · ops corp card", reference: "Linear seat upgrade", vendor: "Linear Orbit Inc.", status: "cleared" },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  { id: "po-001", number: "PO-2026-0042", vendor: "PT. Komputer Sentral", vendorContact: "sales@komputersentral.id", date: "2026-05-12", deliveryDate: "2026-05-23", subtotal: 78_500_000, taxAmount: 8_635_000, total: 87_135_000, status: "approved", approverName: "Damar Wicaksono", approvedAt: "2026-05-13", items: 6 },
  { id: "po-002", number: "PO-2026-0043", vendor: "JetBrains s.r.o.", vendorContact: "sales@jetbrains.com", date: "2026-05-14", deliveryDate: "2026-05-14", subtotal: 24_300_000, taxAmount: 2_673_000, total: 26_973_000, status: "received", approverName: "Damar Wicaksono", approvedAt: "2026-05-14", items: 2 },
  { id: "po-003", number: "PO-2026-0044", vendor: "Datadog Inc.", vendorContact: "ap@datadoghq.com", date: "2026-05-17", deliveryDate: "2026-05-31", subtotal: 56_000_000, taxAmount: 6_160_000, total: 62_160_000, status: "pending-approval", items: 1 },
  { id: "po-004", number: "PO-2026-0045", vendor: "PT. Anugerah Print", vendorContact: "info@anugerahprint.id", date: "2026-05-18", deliveryDate: "2026-05-26", subtotal: 4_800_000, taxAmount: 528_000, total: 5_328_000, status: "draft", items: 3 },
  { id: "po-005", number: "PO-2026-0046", vendor: "Atlassian Pty Ltd", vendorContact: "ap@atlassian.com", date: "2026-05-18", deliveryDate: "2026-05-18", subtotal: 18_400_000, taxAmount: 2_024_000, total: 20_424_000, status: "pending-approval", items: 1 },
  { id: "po-006", number: "PO-2026-0040", vendor: "PT. Wisma Mulia Jakarta", vendorContact: "billing@wismamulia.co.id", date: "2026-05-01", deliveryDate: "2026-05-15", subtotal: 11_500_000, taxAmount: 1_265_000, total: 12_765_000, status: "received", approverName: "Damar Wicaksono", approvedAt: "2026-05-02", items: 1 },
  { id: "po-007", number: "PO-2026-0041", vendor: "Adobe Systems Indonesia", vendorContact: "ap-id@adobe.com", date: "2026-05-08", deliveryDate: "2026-05-10", subtotal: 9_600_000, taxAmount: 1_056_000, total: 10_656_000, status: "partially-received", approverName: "Damar Wicaksono", approvedAt: "2026-05-09", items: 4 },
];

export const mockExpenseClaims: ExpenseClaim[] = [
  { id: "ec-001", number: "EXP-2026-0058", employeeName: "Indra Setiawan", date: "2026-05-16", category: "Travel", amount: 4_350_000, status: "submitted", description: "Garuda Core stakeholder workshop · Jakarta hotel + flight" },
  { id: "ec-002", number: "EXP-2026-0059", employeeName: "Bagas Adhitya", date: "2026-05-17", category: "Meals", amount: 1_280_000, status: "approved", description: "Engineering offsite dinner", approverName: "Damar Wicaksono" },
  { id: "ec-003", number: "EXP-2026-0060", employeeName: "Hana Wijaya", date: "2026-05-15", category: "Software", amount: 2_200_000, status: "reimbursed", description: "ChatGPT Team subscription Q2", approverName: "Damar Wicaksono", reimbursedAt: "2026-05-17" },
  { id: "ec-004", number: "EXP-2026-0061", employeeName: "Reza Ardiansyah", date: "2026-05-13", category: "Equipment", amount: 6_750_000, status: "approved", description: "External monitor for QA lab", approverName: "Damar Wicaksono" },
  { id: "ec-005", number: "EXP-2026-0062", employeeName: "Citra Anggraini", date: "2026-05-17", category: "Marketing", amount: 3_900_000, status: "submitted", description: "Sponsored booth · TechWeek ID 2026" },
  { id: "ec-006", number: "EXP-2026-0063", employeeName: "Sekar Wulandari", date: "2026-05-14", category: "Travel", amount: 5_600_000, status: "submitted", description: "Banyu SCADA UAT trip · Bandung" },
  { id: "ec-007", number: "EXP-2026-0064", employeeName: "Yoga Saputra", date: "2026-05-12", category: "Software", amount: 1_950_000, status: "rejected", description: "Misc subscription · outside policy" },
  { id: "ec-008", number: "EXP-2026-0065", employeeName: "Aulia Kurniawan", date: "2026-05-18", category: "Other", amount: 850_000, status: "submitted", description: "Client gift basket — Selasar Health" },
];
