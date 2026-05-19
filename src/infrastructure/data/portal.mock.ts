import type {
  OnboardingTask,
  ChatThread,
  ChatMessage,
  HRMeetingSlot,
  HRMeetingRequest,
} from "@/domain/entities/Portal";
import type { LeaveRequest } from "@/domain/entities/Employee";

// Logged-in employee for the portal demo (Rizky Pratama)
export const PORTAL_EMPLOYEE_ID = "tm-003";
export const PORTAL_EMPLOYEE_HR_BUDDY_ID = "tm-008"; // Nadya — BA
export const PORTAL_EMPLOYEE_HR_LEAD_ID = "tm-005"; // Damar — Director

export const mockOnboardingTasks: OnboardingTask[] = [
  // Week 1
  { id: "ob-001", title: "Sign employment contract", description: "DocuSign letter from HR — countersigned by Director.", category: "HR", weekNumber: 1, status: "Done", ownerHint: "Nadya · HR", completedAt: "2025-02-03" },
  { id: "ob-002", title: "Set up company email + SSO", description: "Provision @wit.id Google Workspace + Okta SSO.", category: "IT", weekNumber: 1, status: "Done", ownerHint: "Yoga · DevOps", completedAt: "2025-02-03" },
  { id: "ob-003", title: "Receive laptop + peripherals", description: "MacBook Pro 14\" + Apple display + mechanical keyboard.", category: "IT", weekNumber: 1, status: "Done", ownerHint: "Yoga · DevOps", completedAt: "2025-02-04" },
  { id: "ob-004", title: "BPJS Kesehatan registration", description: "Submit KTP + family card to HR for BPJS enrollment.", category: "Compliance", weekNumber: 1, status: "Done", ownerHint: "Nadya · HR", completedAt: "2025-02-05" },
  { id: "ob-005", title: "Meet with team", description: "30-min intro coffee with each member of your engineering pod.", category: "Social", weekNumber: 1, status: "Done", ownerHint: "Bagas · Head of Eng", completedAt: "2025-02-06" },

  // Week 2
  { id: "ob-006", title: "Read employee handbook", description: "Section 1–3: Code of conduct, leave policy, expense policy.", category: "HR", weekNumber: 2, status: "Done", ownerHint: "Nadya · HR", resourceUrl: "/handbook", completedAt: "2025-02-10" },
  { id: "ob-007", title: "Engineering tooling walkthrough", description: "Linear, GitHub, Vercel, Datadog. Pair with Galang.", category: "Tools", weekNumber: 2, status: "Done", ownerHint: "Galang · Backend", completedAt: "2025-02-11" },
  { id: "ob-008", title: "Frontend tech stack standard 2026", description: "Review the firm's frontend baseline (Next.js + Tailwind).", category: "Training", weekNumber: 2, status: "Done", ownerHint: "Self-paced", resourceUrl: "/wiki/frontend-2026", completedAt: "2025-02-12" },

  // Week 3 — in progress
  { id: "ob-009", title: "First-week retro with manager", description: "Reflect on what's working and what's blocking you.", category: "HR", weekNumber: 3, status: "In Progress", ownerHint: "Bagas · Head of Eng" },
  { id: "ob-010", title: "Ship first PR to a live project", description: "Pick a `good-first-issue` from your assigned project and land it.", category: "Training", weekNumber: 3, status: "In Progress", ownerHint: "Self · with reviewer" },
  { id: "ob-011", title: "Indonesian compliance training", description: "PSAK + privacy refresher. Required for billable engagement.", category: "Compliance", weekNumber: 3, status: "Pending", ownerHint: "Compliance team", resourceUrl: "/training/compliance-id" },

  // Week 4
  { id: "ob-012", title: "Set Q3 OKRs with manager", description: "Draft 3 personal OKRs aligned with team goals.", category: "HR", weekNumber: 4, status: "Pending", ownerHint: "Bagas · Head of Eng" },
  { id: "ob-013", title: "Domain deep-dive: pick a vertical", description: "Banking, Health, or Retail — pick one and read internal case studies.", category: "Training", weekNumber: 4, status: "Pending", ownerHint: "Self-paced" },
  { id: "ob-014", title: "Company town hall (monthly)", description: "Friday 16:00 in main meeting room or via Zoom.", category: "Social", weekNumber: 4, status: "Pending", ownerHint: "Damar · Director" },
];

export const mockChatThreads: ChatThread[] = [
  { id: "ct-001", participantIds: [PORTAL_EMPLOYEE_ID, PORTAL_EMPLOYEE_HR_BUDDY_ID], title: "HR · Nadya Hapsari", lastMessage: "Sure, let's confirm tomorrow 10am for the BPJS card pickup.", lastAt: "2026-05-19T08:42:00Z", unread: 1, kind: "HR" },
  { id: "ct-002", participantIds: [PORTAL_EMPLOYEE_ID, "tm-001"], title: "Manager · Bagas Adhitya", lastMessage: "Great work on the FX cache PR — review in the morning.", lastAt: "2026-05-19T07:55:00Z", unread: 0, kind: "Manager" },
  { id: "ct-003", participantIds: [PORTAL_EMPLOYEE_ID, "tm-009", "tm-013"], title: "Frontend pod", lastMessage: "Ferdi: pushing the Pelangi UI update tonight, can someone glance the PR?", lastAt: "2026-05-19T06:20:00Z", unread: 2, kind: "Team" },
  { id: "ct-004", participantIds: [PORTAL_EMPLOYEE_ID, PORTAL_EMPLOYEE_HR_LEAD_ID], title: "Director · Damar Wicaksono", lastMessage: "Damar: Look forward to your retro on Thursday.", lastAt: "2026-05-18T17:10:00Z", unread: 0, kind: "DM" },
  { id: "ct-005", participantIds: [PORTAL_EMPLOYEE_ID, "tm-006"], title: "QA · Putri Andriani", lastMessage: "Putri: Reproduced the bug locally, attaching the trace.", lastAt: "2026-05-18T15:40:00Z", unread: 0, kind: "DM" },
];

export const mockChatMessages: ChatMessage[] = [
  // ct-001 (HR · Nadya)
  { id: "cm-001", threadId: "ct-001", fromMemberId: PORTAL_EMPLOYEE_ID, content: "Hi Nadya, when can I pick up the BPJS Kesehatan physical card?", at: "2026-05-19T08:30:00Z" },
  { id: "cm-002", threadId: "ct-001", fromMemberId: PORTAL_EMPLOYEE_HR_BUDDY_ID, content: "Hi Rizky! It's arrived this week. Are you in tomorrow morning?", at: "2026-05-19T08:38:00Z" },
  { id: "cm-003", threadId: "ct-001", fromMemberId: PORTAL_EMPLOYEE_ID, content: "Yes, I'll be in 9-12. Is 10am OK?", at: "2026-05-19T08:40:00Z" },
  { id: "cm-004", threadId: "ct-001", fromMemberId: PORTAL_EMPLOYEE_HR_BUDDY_ID, content: "Sure, let's confirm tomorrow 10am for the BPJS card pickup.", at: "2026-05-19T08:42:00Z" },

  // ct-002 (Manager · Bagas)
  { id: "cm-005", threadId: "ct-002", fromMemberId: "tm-001", content: "Great work on the FX cache PR — review in the morning.", at: "2026-05-19T07:55:00Z" },

  // ct-003 (Frontend pod)
  { id: "cm-006", threadId: "ct-003", fromMemberId: "tm-009", content: "Pushing the Pelangi UI update tonight, can someone glance the PR?", at: "2026-05-19T06:20:00Z" },
  { id: "cm-007", threadId: "ct-003", fromMemberId: "tm-013", content: "I'll grab it after lunch.", at: "2026-05-19T06:25:00Z" },
];

// Employee's recent leave requests (from his perspective)
export const mockEmployeeLeaveRequests: LeaveRequest[] = [
  { id: "elr-001", employeeId: "emp-3", type: "Annual", startDate: "2026-05-26", endDate: "2026-05-30", days: 5, reason: "Family trip Bali", status: "pending", submittedAt: "2026-05-15" },
  { id: "elr-002", employeeId: "emp-3", type: "Sick", startDate: "2026-04-22", endDate: "2026-04-23", days: 2, reason: "Flu", status: "approved", approverId: "tm-005", submittedAt: "2026-04-21" },
  { id: "elr-003", employeeId: "emp-3", type: "Annual", startDate: "2026-02-10", endDate: "2026-02-11", days: 2, reason: "Personal", status: "approved", approverId: "tm-005", submittedAt: "2026-02-05" },
];

// HR availability for next 5 working days
const NEXT_DAYS = ["2026-05-20", "2026-05-21", "2026-05-22", "2026-05-23", "2026-05-26"];
const SLOT_TIMES: Array<{ start: string; end: string }> = [
  { start: "09:00", end: "09:30" },
  { start: "10:00", end: "10:30" },
  { start: "11:00", end: "11:30" },
  { start: "13:00", end: "13:30" },
  { start: "14:00", end: "14:30" },
  { start: "15:30", end: "16:00" },
];

export const mockHRSlots: HRMeetingSlot[] = NEXT_DAYS.flatMap((date, di) =>
  SLOT_TIMES.map((slot, si) => ({
    id: `slot-${di}-${si}`,
    hrMemberId: di % 2 === 0 ? PORTAL_EMPLOYEE_HR_BUDDY_ID : PORTAL_EMPLOYEE_HR_LEAD_ID,
    date,
    startTime: slot.start,
    endTime: slot.end,
    booked: (di * SLOT_TIMES.length + si) % 7 === 0,
  })),
);

export const mockHRMeetingRequests: HRMeetingRequest[] = [
  { id: "hmr-001", hrMemberId: PORTAL_EMPLOYEE_HR_BUDDY_ID, employeeMemberId: PORTAL_EMPLOYEE_ID, date: "2026-05-21", time: "10:00", purpose: "Onboarding", notes: "End-of-month 1:1 check-in", status: "Confirmed" },
  { id: "hmr-002", hrMemberId: PORTAL_EMPLOYEE_HR_LEAD_ID, employeeMemberId: PORTAL_EMPLOYEE_ID, date: "2026-04-15", time: "14:00", purpose: "Performance", notes: "First-quarter review", status: "Completed" },
];
