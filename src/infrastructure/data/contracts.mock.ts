import type { Contract } from "@/domain/entities/Contract";
import type { Proposal } from "@/domain/entities/Proposal";

export const mockContracts: Contract[] = [
  { id: "ct-001", number: "WIT-CTR-2025-014", clientId: "cl-001", projectId: "prj-001", title: "Garuda Core Banking SOW v3", value: 2_400_000_000, startDate: "2025-09-01", endDate: "2026-08-30", status: "active", signed: true, type: "Fixed-Price" },
  { id: "ct-002", number: "WIT-CTR-2025-021", clientId: "cl-002", projectId: "prj-002", title: "Nusantara OMS Phase 2", value: 1_650_000_000, startDate: "2025-05-12", endDate: "2026-06-15", status: "active", signed: true, type: "Fixed-Price" },
  { id: "ct-003", number: "WIT-CTR-2025-029", clientId: "cl-003", projectId: "prj-003", title: "Cendrawasih TMS Build", value: 1_200_000_000, startDate: "2025-11-04", endDate: "2026-08-12", status: "active", signed: true, type: "Fixed-Price" },
  { id: "ct-004", number: "WIT-CTR-2025-035", clientId: "cl-004", projectId: "prj-004", title: "Banyu SCADA Engagement", value: 980_000_000, startDate: "2025-07-22", endDate: "2026-06-08", status: "expiring", signed: true, type: "Fixed-Price" },
  { id: "ct-005", number: "WIT-CTR-2026-002", clientId: "cl-005", projectId: "prj-005", title: "Selasar EMR Multi-Phase", value: 1_450_000_000, startDate: "2025-10-15", endDate: "2026-11-30", status: "active", signed: true, type: "Time & Materials" },
  { id: "ct-006", number: "WIT-CTR-2026-006", clientId: "cl-007", projectId: "prj-007", title: "Jagat EduPrime LMS Pilot", value: 540_000_000, startDate: "2025-12-01", endDate: "2026-07-25", status: "review", signed: false, type: "Fixed-Price" },
  { id: "ct-007", number: "WIT-CTR-2026-011", clientId: "cl-008", projectId: "prj-008", title: "Maritim Port Tracking Discovery", value: 240_000_000, startDate: "2026-04-20", endDate: "2026-07-30", status: "active", signed: true, type: "Time & Materials" },
  { id: "ct-008", number: "WIT-CTR-2025-018", clientId: "cl-011", projectId: "prj-011", title: "Sinar Properti CRM Retainer", value: 680_000_000, startDate: "2024-10-01", endDate: "2025-12-15", status: "expired", signed: true, type: "Retainer" },
];

export const mockProposals: Proposal[] = [
  { id: "pp-001", number: "WIT-PRO-2026-024", title: "Galuh FinTech KYC Modernization", leadId: "ld-013", value: 2_700_000_000, status: "in-review", approvalStage: "pending-client", expiryDate: "2026-06-20", signatureStatus: "unsigned", createdAt: "2026-04-10" },
  { id: "pp-002", number: "WIT-PRO-2026-028", title: "Putra Mandiri Logistik TMS", leadId: "ld-007", value: 1_550_000_000, status: "in-review", approvalStage: "pending-client", expiryDate: "2026-06-12", signatureStatus: "unsigned", createdAt: "2026-04-22" },
  { id: "pp-003", number: "WIT-PRO-2026-030", title: "Sentosa Health Portal", leadId: "ld-011", value: 1_840_000_000, status: "sent", approvalStage: "pending-client", expiryDate: "2026-06-30", signatureStatus: "unsigned", createdAt: "2026-04-29" },
  { id: "pp-004", number: "WIT-PRO-2026-022", title: "Sumber Pangan Sejahtera POS", leadId: "ld-001", value: 1_200_000_000, status: "approved", approvalStage: "approved", expiryDate: "2026-06-15", signatureStatus: "client-signed", createdAt: "2026-04-02" },
  { id: "pp-005", number: "WIT-PRO-2026-019", title: "Mitra Tani Field App", leadId: "ld-012", value: 520_000_000, status: "approved", approvalStage: "approved", expiryDate: "2026-06-01", signatureStatus: "fully-signed", createdAt: "2026-03-18" },
  { id: "pp-006", number: "WIT-PRO-2026-031", title: "Surya Kencana Driver App", leadId: "ld-020", value: 1_320_000_000, status: "drafting", approvalStage: "pending-internal", expiryDate: "2026-06-25", signatureStatus: "unsigned", createdAt: "2026-05-08" },
  { id: "pp-007", number: "WIT-PRO-2026-014", title: "Pantai Indah Travel Booking", leadId: "ld-014", value: 410_000_000, status: "rejected", approvalStage: "rejected", expiryDate: "2026-05-01", signatureStatus: "unsigned", createdAt: "2026-02-12" },
  { id: "pp-008", number: "WIT-PRO-2026-027", title: "Bumi Aksara LMS Pilot", leadId: "ld-018", value: 870_000_000, status: "sent", approvalStage: "pending-client", expiryDate: "2026-06-10", signatureStatus: "unsigned", createdAt: "2026-04-14" },
];
