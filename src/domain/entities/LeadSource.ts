import type { ID } from "@/types/common";
import type { LeadSource as LeadSourceType } from "./Lead";

export interface LeadSourceMetric {
  id: ID;
  source: LeadSourceType;
  leadCount: number;
  qualifiedCount: number;
  wonCount: number;
  totalValue: number;
  conversionRate: number;
  averageDealValue: number;
}

export type LeadQualification = "Cold" | "Warm" | "Hot" | "MQL" | "SQL";

export const QUALIFICATION_ORDER: LeadQualification[] = [
  "Cold",
  "Warm",
  "Hot",
  "MQL",
  "SQL",
];

export interface LeadActivity {
  id: ID;
  leadId: ID;
  actorId: ID;
  type: "Call" | "Email" | "Meeting" | "Note" | "Stage Change";
  subject: string;
  body?: string;
  at: string;
  nextActionDate?: string;
}

export interface LeadScoringRule {
  id: ID;
  category: "Demographic" | "Behavioral" | "Fit";
  description: string;
  points: number;
  active: boolean;
}
