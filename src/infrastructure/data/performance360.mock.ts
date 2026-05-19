import { mockEmployees } from "./employees.mock";

export type Performance360Status = "draft" | "active" | "closed" | "archived";
export type QuestionType = "rating" | "text" | "rating_with_reason";
export type RaterRole = "self" | "manager" | "peer" | "subordinate";
export type SubmissionStatus = "pending" | "in_progress" | "submitted" | "expired";

export interface Performance360Template {
  id: string;
  name: string;
  description: string;
  periodKind: "annual" | "semester" | "quarterly" | "custom";
  periodYear: number;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  ratingScaleMax: number;
  status: Performance360Status;
  createdAt: string;
}

export interface Performance360Question {
  id: string;
  templateId: string;
  sortOrder: number;
  sectionTitle: string;
  questionText: string;
  questionType: QuestionType;
  category: string;
  weight: number;
  appliesToRole: "all" | RaterRole;
}

export interface Performance360Submission {
  id: string;
  templateId: string;
  raterEmployeeId: string;
  rateeEmployeeId: string;
  raterRole: RaterRole;
  status: SubmissionStatus;
  submittedAt?: string;
}

export interface Performance360Answer {
  id: string;
  submissionId: string;
  questionId: string;
  rating?: number;
  reasonText?: string;
}

export interface Performance360RaterSettings {
  rateeEmployeeId: string;
  directManagerEmployeeId?: string;
  allowSelf: boolean;
  allowManager: boolean;
  allowPeer: boolean;
  allowSubordinate: boolean;
}

export const mockPerformanceTemplates: Performance360Template[] = [
  {
    id: "t360-2026-h1",
    name: "Mid-year 360 Review",
    description: "Comprehensive peer + manager + self-review for H1 2026.",
    periodKind: "semester",
    periodYear: 2026,
    periodLabel: "2026 H1",
    periodStart: "2026-01-01",
    periodEnd: "2026-06-30",
    ratingScaleMax: 5,
    status: "active",
    createdAt: "2026-03-15",
  },
  {
    id: "t360-2026-q1",
    name: "Q1 Pulse Check",
    description: "Lightweight manager-only quarterly check-in.",
    periodKind: "quarterly",
    periodYear: 2026,
    periodLabel: "2026 Q1",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    ratingScaleMax: 5,
    status: "closed",
    createdAt: "2026-01-10",
  },
  {
    id: "t360-2025-annual",
    name: "Annual Review 2025",
    description: "Full-year performance review across all rater roles.",
    periodKind: "annual",
    periodYear: 2025,
    periodLabel: "2025 Annual",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    ratingScaleMax: 5,
    status: "archived",
    createdAt: "2025-12-01",
  },
  {
    id: "t360-2026-h2",
    name: "End-of-year 360 (draft)",
    description: "Draft template for H2 2026 review.",
    periodKind: "semester",
    periodYear: 2026,
    periodLabel: "2026 H2",
    periodStart: "2026-07-01",
    periodEnd: "2026-12-31",
    ratingScaleMax: 5,
    status: "draft",
    createdAt: "2026-05-10",
  },
];

const PILLARS = [
  "Delivery",
  "Collaboration",
  "Communication",
  "Ownership",
  "Growth",
  "Leadership",
] as const;

export const mockPerformanceQuestions: Performance360Question[] = [
  // H1 2026 template
  ...PILLARS.flatMap((pillar, idx) =>
    [
      {
        text:
          pillar === "Delivery"
            ? "Consistently ships work that meets the agreed quality bar."
            : pillar === "Collaboration"
              ? "Works well across team boundaries and unblocks others."
              : pillar === "Communication"
                ? "Communicates progress, blockers and decisions clearly."
                : pillar === "Ownership"
                  ? "Takes end-to-end ownership and follows through."
                  : pillar === "Growth"
                    ? "Actively seeks feedback and improves over time."
                    : "Sets direction, develops others, and elevates the team.",
        type: "rating_with_reason" as QuestionType,
        weight: pillar === "Leadership" ? 1.5 : 1.0,
        role: pillar === "Leadership" ? ("manager" as const) : ("all" as const),
      },
    ].map((q, i) => ({
      id: `q360-h1-${pillar.toLowerCase()}-${i + 1}`,
      templateId: "t360-2026-h1",
      sortOrder: idx * 10 + i,
      sectionTitle: pillar,
      questionText: q.text,
      questionType: q.type,
      category: pillar,
      weight: q.weight,
      appliesToRole: q.role,
    })),
  ),
  // Q1 pulse — minimal
  {
    id: "q360-q1-1",
    templateId: "t360-2026-q1",
    sortOrder: 0,
    sectionTitle: "Snapshot",
    questionText: "On track this quarter overall?",
    questionType: "rating",
    category: "Snapshot",
    weight: 1.0,
    appliesToRole: "manager",
  },
  {
    id: "q360-q1-2",
    templateId: "t360-2026-q1",
    sortOrder: 1,
    sectionTitle: "Snapshot",
    questionText: "Single thing they should do more / less of?",
    questionType: "text",
    category: "Snapshot",
    weight: 1.0,
    appliesToRole: "manager",
  },
];

// Per-employee rater settings
export const mockRaterSettings: Performance360RaterSettings[] = mockEmployees.map((e, i) => ({
  rateeEmployeeId: e.id,
  directManagerEmployeeId: i === 4 ? undefined : mockEmployees[4]?.id,
  allowSelf: true,
  allowManager: true,
  allowPeer: i % 3 !== 2, // most allow peer
  allowSubordinate: i < 5, // only senior staff get subordinate feedback
}));

// Submissions for the active template — randomized across rater roles
function rateeFor(i: number): string {
  return mockEmployees[i % mockEmployees.length].id;
}
function raterFor(i: number, offset: number): string {
  return mockEmployees[(i + offset) % mockEmployees.length].id;
}

export const mockPerformanceSubmissions: Performance360Submission[] = mockEmployees.flatMap(
  (emp, i) => {
    const rows: Performance360Submission[] = [];
    // self
    rows.push({
      id: `sub-h1-${emp.id}-self`,
      templateId: "t360-2026-h1",
      raterEmployeeId: emp.id,
      rateeEmployeeId: emp.id,
      raterRole: "self",
      status: i < 8 ? "submitted" : i < 12 ? "in_progress" : "pending",
      submittedAt: i < 8 ? `2026-05-${String((i % 18) + 1).padStart(2, "0")}` : undefined,
    });
    // manager
    rows.push({
      id: `sub-h1-${emp.id}-mgr`,
      templateId: "t360-2026-h1",
      raterEmployeeId: raterFor(i, 4),
      rateeEmployeeId: emp.id,
      raterRole: "manager",
      status: i < 6 ? "submitted" : i < 10 ? "in_progress" : "pending",
      submittedAt: i < 6 ? `2026-05-${String((i % 16) + 2).padStart(2, "0")}` : undefined,
    });
    // peers (2)
    for (let p = 0; p < 2; p++) {
      rows.push({
        id: `sub-h1-${emp.id}-peer-${p}`,
        templateId: "t360-2026-h1",
        raterEmployeeId: raterFor(i, 2 + p),
        rateeEmployeeId: emp.id,
        raterRole: "peer",
        status:
          (i + p) % 3 === 0 ? "submitted" : (i + p) % 3 === 1 ? "in_progress" : "pending",
        submittedAt: (i + p) % 3 === 0 ? `2026-05-${String((i + p + 5)).padStart(2, "0")}` : undefined,
      });
    }
    return rows;
  },
);

// Synthetic answers — ratings 3-5 with some variance per category
export const mockPerformanceAnswers: Performance360Answer[] = mockPerformanceSubmissions
  .filter((s) => s.status === "submitted" && s.templateId === "t360-2026-h1")
  .flatMap((s, si) => {
    const qs = mockPerformanceQuestions.filter(
      (q) =>
        q.templateId === s.templateId &&
        (q.appliesToRole === "all" || q.appliesToRole === s.raterRole),
    );
    return qs.map((q, qi) => ({
      id: `ans-${s.id}-${q.id}`,
      submissionId: s.id,
      questionId: q.id,
      // deterministic but varied 3-5 rating
      rating: q.questionType === "text" ? undefined : 3 + ((si + qi + q.weight * 2) % 3),
      reasonText:
        q.questionType === "rating_with_reason"
          ? si % 4 === 0
            ? "Strong technical depth and reliable delivery."
            : si % 4 === 1
              ? "Could improve cross-team visibility."
              : si % 4 === 2
                ? "Consistently above expectations."
                : "Mentoring others has lifted the team."
          : q.questionType === "text"
            ? si % 2 === 0
              ? "More architectural reviews / less ad-hoc firefighting."
              : "More proactive comms when things slip."
            : undefined,
    }));
  });

// Used to silence unused warnings if any helper isn't called
void rateeFor;
