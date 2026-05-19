import type { UserAccount, AuditLogEntry } from "@/domain/entities/User";

export const mockUsers: UserAccount[] = [
  { id: "u-001", memberId: "tm-005", email: "damar@wit.id", role: "Director", active: true, lastLogin: "2026-05-18T08:42:00Z" },
  { id: "u-002", memberId: "tm-001", email: "bagas@wit.id", role: "Super Admin", active: true, lastLogin: "2026-05-18T08:55:00Z" },
  { id: "u-003", memberId: "tm-014", email: "indra@wit.id", role: "Project Manager", active: true, lastLogin: "2026-05-18T07:30:00Z" },
  { id: "u-004", memberId: "tm-003", email: "rizky@wit.id", role: "Developer", active: true, lastLogin: "2026-05-18T09:00:00Z" },
  { id: "u-005", memberId: "tm-006", email: "putri@wit.id", role: "Developer", active: true, lastLogin: "2026-05-18T08:10:00Z" },
  { id: "u-006", memberId: "tm-008", email: "nadya@wit.id", role: "Business Analyst", active: true, lastLogin: "2026-05-17T18:22:00Z" },
  { id: "u-007", memberId: "tm-015", email: "citra@wit.id", role: "Sales", active: true, lastLogin: "2026-05-18T08:00:00Z" },
  { id: "u-008", memberId: "tm-010", email: "hana@wit.id", role: "Project Manager", active: true, lastLogin: "2026-05-18T07:45:00Z" },
  { id: "u-009", memberId: "tm-016", email: "bayu@wit.id", role: "Developer", active: false, lastLogin: "2026-04-30T08:00:00Z" },
  { id: "u-010", memberId: "tm-013", email: "reza@wit.id", role: "Developer", active: true, lastLogin: "2026-05-18T08:33:00Z" },
];

export const mockAuditLog: AuditLogEntry[] = [
  { id: "al-001", actorId: "tm-005", action: "Approved invoice", target: "INV-2026-0048", at: "2026-05-18T08:42:00Z" },
  { id: "al-002", actorId: "tm-014", action: "Updated risk", target: "Project CDW-TMS", at: "2026-05-18T08:30:00Z" },
  { id: "al-003", actorId: "tm-001", action: "Resolved incident", target: "GRD-T-1024", at: "2026-05-18T08:18:00Z" },
  { id: "al-004", actorId: "tm-015", action: "Moved deal", target: "Galuh FinTech → Negotiation", at: "2026-05-18T07:55:00Z" },
  { id: "al-005", actorId: "tm-003", action: "Submitted PR", target: "GRD-319 FX cache", at: "2026-05-17T22:14:00Z" },
  { id: "al-006", actorId: "tm-006", action: "Closed regression", target: "NRG-OMS UAT-21", at: "2026-05-17T19:02:00Z" },
  { id: "al-007", actorId: "tm-010", action: "Published roadmap", target: "Selasar EMR Q3 plan", at: "2026-05-17T16:10:00Z" },
];
