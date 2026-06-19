import type { Quotation } from "@/domain/entities/Quotation";

/**
 * Seed quotations, linked to the same client/project ids as the invoice seed so
 * a project drill shows both the proposal it won on and the invoices that
 * followed. Status mix is realistic: accepted deals became projects, while a
 * few sits as sent / draft / rejected / expired.
 */
export const mockQuotations: Quotation[] = [
  { id: "qt-001", number: "QUO-2026-0008", clientId: "cl-001", projectId: "prj-001", title: "Core Banking Modernization — Phase 1", issueDate: "2026-02-10", validUntil: "2026-03-12", amount: 837_500_000, status: "accepted", currency: "IDR" },
  { id: "qt-002", number: "QUO-2026-0029", clientId: "cl-001", projectId: "prj-001", title: "Core Banking — Reporting Module (Change Request)", issueDate: "2026-05-02", validUntil: "2026-06-01", amount: 178_400_000, status: "sent", currency: "IDR" },
  { id: "qt-003", number: "QUO-2026-0011", clientId: "cl-002", projectId: "prj-002", title: "Mobile Banking App — Build & Launch", issueDate: "2026-02-20", validUntil: "2026-03-22", amount: 564_200_000, status: "accepted", currency: "IDR" },
  { id: "qt-004", number: "QUO-2026-0006", clientId: "cl-003", projectId: "prj-003", title: "Logistics TMS Rollout", issueDate: "2026-01-30", validUntil: "2026-03-01", amount: 387_600_000, status: "accepted", currency: "IDR" },
  { id: "qt-005", number: "QUO-2026-0033", clientId: "cl-003", projectId: "prj-003", title: "TMS — Driver Mobile App Add-on", issueDate: "2026-05-05", validUntil: "2026-06-04", amount: 118_900_000, status: "rejected", currency: "IDR" },
  { id: "qt-006", number: "QUO-2026-0014", clientId: "cl-004", projectId: "prj-004", title: "Energy Grid Monitoring Dashboard", issueDate: "2026-03-01", validUntil: "2026-03-31", amount: 167_300_000, status: "sent", currency: "IDR" },
  { id: "qt-007", number: "QUO-2026-0009", clientId: "cl-005", projectId: "prj-005", title: "HealthTech Patient Portal", issueDate: "2026-02-12", validUntil: "2026-03-14", amount: 483_750_000, status: "accepted", currency: "IDR" },
  { id: "qt-008", number: "QUO-2026-0018", clientId: "cl-007", projectId: "prj-007", title: "EdTech LMS Integration", issueDate: "2026-02-28", validUntil: "2026-03-30", amount: 207_500_000, status: "expired", currency: "IDR" },
  { id: "qt-009", number: "QUO-2026-0024", clientId: "cl-008", projectId: "prj-008", title: "Cargo Tracking Portal", issueDate: "2026-03-25", validUntil: "2026-04-24", amount: 112_300_000, status: "accepted", currency: "IDR" },
  { id: "qt-010", number: "QUO-2026-0010", clientId: "cl-009", projectId: "prj-009", title: "Insurance Claims Automation", issueDate: "2026-02-18", validUntil: "2026-03-20", amount: 638_900_000, status: "accepted", currency: "IDR" },
  { id: "qt-011", number: "QUO-2026-0037", clientId: "cl-009", projectId: "prj-009", title: "Claims — Fraud Scoring Add-on", issueDate: "2026-05-14", validUntil: "2026-06-13", amount: 196_800_000, status: "draft", currency: "IDR" },
  { id: "qt-012", number: "QUO-2026-0027", clientId: "cl-011", projectId: "prj-011", title: "Retail POS Revamp", issueDate: "2026-04-18", validUntil: "2026-05-18", amount: 97_400_000, status: "sent", currency: "IDR" },
  { id: "qt-013", number: "QUO-2026-0016", clientId: "cl-012", projectId: "prj-012", title: "Property Listing Platform", issueDate: "2026-03-05", validUntil: "2026-04-04", amount: 143_650_000, status: "accepted", currency: "IDR" },
];
