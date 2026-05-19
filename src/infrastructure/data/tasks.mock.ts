import type { Task } from "@/domain/entities/Task";
import type { Sprint } from "@/domain/entities/Sprint";

export const mockSprints: Sprint[] = [
  { id: "sp-001", name: "Garuda Core — Sprint 18", projectId: "prj-001", startDate: "2026-05-05", endDate: "2026-05-19", goal: "Stabilize ledger posting + finalize FX module", committedPoints: 64, completedPoints: 42, status: "active" },
  { id: "sp-002", name: "Nusantara OMS — Sprint 24", projectId: "prj-002", startDate: "2026-05-05", endDate: "2026-05-19", goal: "Close UAT regressions and prepare go-live", committedPoints: 52, completedPoints: 48, status: "active" },
  { id: "sp-003", name: "Selasar EMR — Sprint 9", projectId: "prj-005", startDate: "2026-05-08", endDate: "2026-05-22", goal: "Vitals capture + lab order workflow", committedPoints: 58, completedPoints: 26, status: "active" },
  { id: "sp-004", name: "Pelangi Claims — Sprint 14", projectId: "prj-009", startDate: "2026-05-05", endDate: "2026-05-19", goal: "Adjudicator review workflow", committedPoints: 60, completedPoints: 36, status: "active" },
];

export const mockTasks: Task[] = [
  { id: "tsk-001", code: "GRD-318", title: "Stabilize ledger posting under concurrent writes", projectId: "prj-001", sprintId: "sp-001", status: "In Progress", priority: "critical", storyPoints: 8, assigneeId: "tm-001", blocked: false, createdAt: "2026-05-05", dueDate: "2026-05-19" },
  { id: "tsk-002", code: "GRD-319", title: "FX rate cache fallback for offline mode", projectId: "prj-001", sprintId: "sp-001", status: "Review", priority: "high", storyPoints: 5, assigneeId: "tm-011", blocked: false, createdAt: "2026-05-05", dueDate: "2026-05-17" },
  { id: "tsk-003", code: "GRD-320", title: "Update reconciliation dashboard filters", projectId: "prj-001", sprintId: "sp-001", status: "QA", priority: "medium", storyPoints: 3, assigneeId: "tm-003", blocked: false, createdAt: "2026-05-05" },
  { id: "tsk-004", code: "GRD-321", title: "Audit log retention policy", projectId: "prj-001", sprintId: "sp-001", status: "Done", priority: "low", storyPoints: 2, assigneeId: "tm-001", blocked: false, createdAt: "2026-05-05" },
  { id: "tsk-005", code: "GRD-322", title: "Token rotation playbook", projectId: "prj-001", sprintId: "sp-001", status: "To Do", priority: "medium", storyPoints: 3, assigneeId: "tm-011", blocked: true, blockerReason: "Awaiting security review", createdAt: "2026-05-08" },
  { id: "tsk-006", code: "GRD-323", title: "Branch close-of-day batch performance", projectId: "prj-001", sprintId: "sp-001", status: "Backlog", priority: "high", storyPoints: 8, assigneeId: "tm-001", blocked: false, createdAt: "2026-05-12" },

  { id: "tsk-007", code: "NRG-241", title: "Fix inventory race in promotion checkout", projectId: "prj-002", sprintId: "sp-002", status: "In Progress", priority: "high", storyPoints: 5, assigneeId: "tm-009", blocked: false, createdAt: "2026-05-05", dueDate: "2026-05-19" },
  { id: "tsk-008", code: "NRG-242", title: "Localize OMS to id-ID number formats", projectId: "prj-002", sprintId: "sp-002", status: "Review", priority: "medium", storyPoints: 3, assigneeId: "tm-002", blocked: false, createdAt: "2026-05-05" },
  { id: "tsk-009", code: "NRG-243", title: "UAT regression for promotion stack", projectId: "prj-002", sprintId: "sp-002", status: "QA", priority: "high", storyPoints: 5, assigneeId: "tm-006", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-010", code: "NRG-244", title: "Go-live runbook draft", projectId: "prj-002", sprintId: "sp-002", status: "Done", priority: "high", storyPoints: 3, assigneeId: "tm-005", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-011", code: "NRG-245", title: "Migrate legacy SKU mapping", projectId: "prj-002", sprintId: "sp-002", status: "To Do", priority: "medium", storyPoints: 5, assigneeId: "tm-009", blocked: false, createdAt: "2026-05-10" },

  { id: "tsk-012", code: "SLS-090", title: "Vitals capture component", projectId: "prj-005", sprintId: "sp-003", status: "In Progress", priority: "high", storyPoints: 8, assigneeId: "tm-004", blocked: false, createdAt: "2026-05-08", dueDate: "2026-05-22" },
  { id: "tsk-013", code: "SLS-091", title: "Lab order workflow modal", projectId: "prj-005", sprintId: "sp-003", status: "To Do", priority: "high", storyPoints: 8, assigneeId: "tm-013", blocked: true, blockerReason: "FHIR mapping pending from client", createdAt: "2026-05-08" },
  { id: "tsk-014", code: "SLS-092", title: "Patient timeline UI revamp", projectId: "prj-005", sprintId: "sp-003", status: "Review", priority: "medium", storyPoints: 5, assigneeId: "tm-002", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-015", code: "SLS-093", title: "Print discharge summary PDF", projectId: "prj-005", sprintId: "sp-003", status: "Backlog", priority: "medium", storyPoints: 5, assigneeId: "tm-004", blocked: false, createdAt: "2026-05-10" },

  { id: "tsk-016", code: "PLG-401", title: "Adjudicator review queue UI", projectId: "prj-009", sprintId: "sp-004", status: "In Progress", priority: "high", storyPoints: 8, assigneeId: "tm-003", blocked: false, createdAt: "2026-05-05", dueDate: "2026-05-19" },
  { id: "tsk-017", code: "PLG-402", title: "Claim auto-routing engine", projectId: "prj-009", sprintId: "sp-004", status: "QA", priority: "critical", storyPoints: 13, assigneeId: "tm-013", blocked: false, createdAt: "2026-05-05" },
  { id: "tsk-018", code: "PLG-403", title: "Adjuster mobile app push notifications", projectId: "prj-009", sprintId: "sp-004", status: "Review", priority: "medium", storyPoints: 5, assigneeId: "tm-009", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-019", code: "PLG-404", title: "Audit trail filter improvements", projectId: "prj-009", sprintId: "sp-004", status: "Done", priority: "low", storyPoints: 3, assigneeId: "tm-003", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-020", code: "PLG-405", title: "Document scanner OCR refresh", projectId: "prj-009", sprintId: "sp-004", status: "To Do", priority: "medium", storyPoints: 8, assigneeId: "tm-009", blocked: false, createdAt: "2026-05-10" },

  { id: "tsk-021", code: "CDW-201", title: "Driver app GPS smoothing", projectId: "prj-003", status: "In Progress", priority: "high", storyPoints: 5, assigneeId: "tm-003", blocked: false, createdAt: "2026-05-12" },
  { id: "tsk-022", code: "CDW-202", title: "Route optimization heuristic v2", projectId: "prj-003", status: "Backlog", priority: "medium", storyPoints: 13, assigneeId: "tm-007", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-023", code: "BNY-105", title: "Real-time alarm panel polish", projectId: "prj-004", status: "QA", priority: "medium", storyPoints: 3, assigneeId: "tm-006", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-024", code: "PTD-021", title: "Marketplace category taxonomy", projectId: "prj-006", status: "To Do", priority: "medium", storyPoints: 5, assigneeId: "tm-012", blocked: false, createdAt: "2026-05-12" },
  { id: "tsk-025", code: "JGT-178", title: "Classroom quiz randomizer hotfix", projectId: "prj-007", status: "In Progress", priority: "critical", storyPoints: 8, assigneeId: "tm-004", blocked: false, createdAt: "2026-05-17" },
  { id: "tsk-026", code: "JGT-179", title: "Roster importer error reporting", projectId: "prj-007", status: "Backlog", priority: "medium", storyPoints: 5, assigneeId: "tm-010", blocked: false, createdAt: "2026-05-14" },
  { id: "tsk-027", code: "MCI-010", title: "Discovery: vessel telemetry feed", projectId: "prj-008", status: "In Progress", priority: "medium", storyPoints: 5, assigneeId: "tm-008", blocked: false, createdAt: "2026-05-12" },
  { id: "tsk-028", code: "WOR-045", title: "Dealer connect catalog import", projectId: "prj-012", status: "In Progress", priority: "high", storyPoints: 8, assigneeId: "tm-002", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-029", code: "WOR-046", title: "Service appointment booking flow", projectId: "prj-012", status: "Review", priority: "medium", storyPoints: 5, assigneeId: "tm-004", blocked: false, createdAt: "2026-05-08" },
  { id: "tsk-030", code: "SPG-088", title: "Lead form character validation patch", projectId: "prj-011", status: "To Do", priority: "high", storyPoints: 2, assigneeId: "tm-009", blocked: false, createdAt: "2026-05-13" },
];
