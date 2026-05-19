import type { LeadActivity, LeadScoringRule } from "@/domain/entities/LeadSource";

export const mockLeadActivities: LeadActivity[] = [
  { id: "la-001", leadId: "ld-001", actorId: "tm-015", type: "Meeting", subject: "Discovery call with CFO", at: "2026-05-18T10:00:00Z", nextActionDate: "2026-05-22T00:00:00Z" },
  { id: "la-002", leadId: "ld-001", actorId: "tm-015", type: "Email", subject: "Sent redline T&Cs", at: "2026-05-17T16:30:00Z" },
  { id: "la-003", leadId: "ld-007", actorId: "tm-015", type: "Stage Change", subject: "Moved to Negotiation", at: "2026-05-16T09:12:00Z" },
  { id: "la-004", leadId: "ld-007", actorId: "tm-015", type: "Meeting", subject: "Operations walkthrough", at: "2026-05-14T13:00:00Z" },
  { id: "la-005", leadId: "ld-013", actorId: "tm-015", type: "Email", subject: "Proposal revision 3 sent", at: "2026-05-17T11:00:00Z" },
  { id: "la-006", leadId: "ld-013", actorId: "tm-015", type: "Call", subject: "30-min budget alignment", at: "2026-05-15T14:00:00Z" },
  { id: "la-007", leadId: "ld-020", actorId: "tm-015", type: "Meeting", subject: "Driver app demo", at: "2026-05-13T10:00:00Z", nextActionDate: "2026-05-25T00:00:00Z" },
  { id: "la-008", leadId: "ld-011", actorId: "tm-015", type: "Email", subject: "Follow-up after webinar", at: "2026-05-16T08:30:00Z" },
  { id: "la-009", leadId: "ld-002", actorId: "tm-015", type: "Note", subject: "Marketing director on leave until Wed", at: "2026-05-17T17:45:00Z" },
  { id: "la-010", leadId: "ld-016", actorId: "tm-015", type: "Meeting", subject: "Solar partner intro", at: "2026-05-14T11:00:00Z" },
  { id: "la-011", leadId: "ld-008", actorId: "tm-015", type: "Call", subject: "Initial qualification", at: "2026-05-15T15:30:00Z" },
  { id: "la-012", leadId: "ld-004", actorId: "tm-015", type: "Email", subject: "Sent clinic-network case study", at: "2026-05-17T09:00:00Z" },
];

export const mockScoringRules: LeadScoringRule[] = [
  { id: "sr-001", category: "Demographic", description: "Deal value > IDR 1B", points: 25, active: true },
  { id: "sr-002", category: "Demographic", description: "Company size > 200 employees", points: 15, active: true },
  { id: "sr-003", category: "Demographic", description: "Indonesian HQ", points: 10, active: true },
  { id: "sr-004", category: "Fit", description: "Industry: Banking / FinTech / Health", points: 20, active: true },
  { id: "sr-005", category: "Fit", description: "Has internal technical sponsor", points: 18, active: true },
  { id: "sr-006", category: "Behavioral", description: "Logged > 2 calls in 14 days", points: 12, active: true },
  { id: "sr-007", category: "Behavioral", description: "Viewed proposal > 1 time", points: 10, active: true },
  { id: "sr-008", category: "Behavioral", description: "Stale > 30 days (penalty)", points: -15, active: true },
];
