import type { ID, ISODate } from "@/types/common";

/**
 * Lifecycle of a sales quotation (the proposal that precedes an invoice):
 * draft → sent → accepted (→ becomes billable) | rejected | expired.
 */
export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export interface Quotation {
  id: ID;
  number: string;
  clientId: ID;
  projectId: ID;
  title: string;
  issueDate: ISODate;
  validUntil: ISODate;
  amount: number;
  status: QuotationStatus;
  currency: "IDR" | "USD";
  notes?: string;
}
