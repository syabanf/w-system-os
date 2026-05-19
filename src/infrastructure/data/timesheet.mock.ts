import type { TimesheetEntry } from "@/domain/entities/Timesheet";

const WEEK = ["2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15", "2026-05-16"];

function entry(
  id: string,
  memberId: string,
  projectId: string,
  dateIdx: number,
  hours: number,
  billable: boolean,
  description: string,
  approvalStatus: TimesheetEntry["approvalStatus"] = "submitted",
): TimesheetEntry {
  return { id, memberId, projectId, date: WEEK[dateIdx], hours, billable, description, approvalStatus };
}

export const mockTimesheet: TimesheetEntry[] = [
  entry("ts-001", "tm-001", "prj-001", 0, 7, true, "Ledger concurrency investigation"),
  entry("ts-002", "tm-001", "prj-001", 1, 8, true, "Ledger fix + integration tests"),
  entry("ts-003", "tm-001", "prj-001", 2, 6, true, "Code review"),
  entry("ts-004", "tm-001", "prj-001", 3, 8, true, "Pair debugging FX cache"),
  entry("ts-005", "tm-001", "prj-001", 4, 7, true, "Production incident response"),

  entry("ts-006", "tm-003", "prj-001", 0, 5, true, "Reconciliation filters"),
  entry("ts-007", "tm-003", "prj-001", 1, 4, true, "Reconciliation review"),
  entry("ts-008", "tm-003", "prj-003", 2, 5, true, "Driver app GPS smoothing"),
  entry("ts-009", "tm-003", "prj-009", 3, 6, true, "Adjudicator UI"),
  entry("ts-010", "tm-003", "prj-009", 4, 6, true, "Adjudicator review queue"),

  entry("ts-011", "tm-004", "prj-005", 0, 8, true, "Vitals capture component"),
  entry("ts-012", "tm-004", "prj-005", 1, 8, true, "Vitals capture polish"),
  entry("ts-013", "tm-004", "prj-007", 2, 4, true, "Quiz randomizer triage"),
  entry("ts-014", "tm-004", "prj-007", 3, 6, true, "Quiz randomizer fix"),
  entry("ts-015", "tm-004", "prj-012", 4, 4, true, "Service appointment review"),

  entry("ts-016", "tm-005", "prj-001", 0, 4, false, "Stakeholder sync — Garuda"),
  entry("ts-017", "tm-005", "prj-002", 1, 4, false, "Go-live runbook draft"),
  entry("ts-018", "tm-005", "prj-005", 2, 3, false, "Backlog refinement"),
  entry("ts-019", "tm-005", "prj-001", 3, 6, false, "Risk review board"),
  entry("ts-020", "tm-005", "prj-002", 4, 5, false, "UAT close-out"),

  entry("ts-021", "tm-002", "prj-002", 0, 6, true, "OMS localization"),
  entry("ts-022", "tm-002", "prj-002", 1, 6, true, "OMS QA"),
  entry("ts-023", "tm-002", "prj-005", 2, 5, true, "Patient timeline UI"),
  entry("ts-024", "tm-002", "prj-005", 3, 7, true, "Timeline UI polish"),
  entry("ts-025", "tm-002", "prj-012", 4, 4, true, "Catalog UX"),

  entry("ts-026", "tm-006", "prj-002", 0, 6, true, "OMS regression"),
  entry("ts-027", "tm-006", "prj-002", 1, 7, true, "OMS regression"),
  entry("ts-028", "tm-006", "prj-004", 2, 5, true, "SCADA alarm panel QA"),
  entry("ts-029", "tm-006", "prj-004", 3, 6, true, "SCADA UAT"),
  entry("ts-030", "tm-006", "prj-006", 4, 4, true, "Pasar Tani QA plan"),
];
