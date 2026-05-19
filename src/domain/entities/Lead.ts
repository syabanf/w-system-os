import type { ID, ISODate } from "@/types/common";

export type LeadStage =
  | "New Lead"
  | "Qualified"
  | "Discovery"
  | "Proposal Sent"
  | "Negotiation"
  | "Won"
  | "Lost";

export const LEAD_STAGES: LeadStage[] = [
  "New Lead",
  "Qualified",
  "Discovery",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
];

export type LeadSource =
  | "Referral"
  | "Website"
  | "Outbound"
  | "Event"
  | "Partner"
  | "Inbound";

export interface Lead {
  id: ID;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  dealValue: number;
  stage: LeadStage;
  source: LeadSource;
  probability: number; // 0..100
  followUpDate: ISODate;
  ownerId: ID;
  createdAt: ISODate;
  notes?: string;
}
