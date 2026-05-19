export interface KnowledgeArticle {
  id: string;
  title: string;
  category: "SOP" | "Templates" | "Tech Stack" | "API Docs" | "Onboarding" | "Delivery Checklist";
  excerpt: string;
  updatedAt: string;
  authorId: string;
  readMinutes: number;
  bookmarked: boolean;
}

export const mockKnowledge: KnowledgeArticle[] = [
  { id: "kb-001", title: "Delivery Lifecycle SOP v3.2", category: "SOP", excerpt: "End-to-end gate criteria from Discovery to Maintenance.", updatedAt: "2026-04-22", authorId: "tm-005", readMinutes: 9, bookmarked: true },
  { id: "kb-002", title: "Sprint Cadence & Ceremonies", category: "SOP", excerpt: "How we run sprints, stand-ups, retros, and demos.", updatedAt: "2026-03-18", authorId: "tm-014", readMinutes: 6, bookmarked: false },
  { id: "kb-003", title: "Project Kickoff Template", category: "Templates", excerpt: "Charter, RACI, comms plan, risk register starter pack.", updatedAt: "2026-02-10", authorId: "tm-008", readMinutes: 4, bookmarked: true },
  { id: "kb-004", title: "Frontend Tech Stack Standard 2026", category: "Tech Stack", excerpt: "Next.js + Tailwind + shadcn/ui + Zustand reference setup.", updatedAt: "2026-04-30", authorId: "tm-003", readMinutes: 11, bookmarked: true },
  { id: "kb-005", title: "Backend Tech Stack Standard 2026", category: "Tech Stack", excerpt: "Go + PostgreSQL services baseline + observability stack.", updatedAt: "2026-05-02", authorId: "tm-001", readMinutes: 13, bookmarked: false },
  { id: "kb-006", title: "Internal Auth API v2", category: "API Docs", excerpt: "JWT issuance, refresh, revoke, and rotation flows.", updatedAt: "2026-03-29", authorId: "tm-001", readMinutes: 7, bookmarked: false },
  { id: "kb-007", title: "Engineering Onboarding Day 1–14", category: "Onboarding", excerpt: "Two-week ramp plan for new engineers joining the firm.", updatedAt: "2026-04-12", authorId: "tm-005", readMinutes: 8, bookmarked: false },
  { id: "kb-008", title: "Pre-Production Readiness Checklist", category: "Delivery Checklist", excerpt: "Security, performance, observability, and rollback gates.", updatedAt: "2026-05-04", authorId: "tm-007", readMinutes: 5, bookmarked: true },
  { id: "kb-009", title: "Client Demo Playbook", category: "Templates", excerpt: "Pre-demo checklist, scripting, contingency plans.", updatedAt: "2026-01-25", authorId: "tm-010", readMinutes: 4, bookmarked: false },
  { id: "kb-010", title: "Incident Response Runbook", category: "SOP", excerpt: "Severity matrix, escalation paths, postmortem template.", updatedAt: "2026-05-12", authorId: "tm-001", readMinutes: 10, bookmarked: true },
];
