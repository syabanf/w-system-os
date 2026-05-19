import type { ID, ISODate } from "@/types/common";

export type InstallmentType =
  | "DP"
  | "UAT"
  | "BAST"
  | "Final"
  | "Pekerjaan 25%"
  | "Pekerjaan 50%"
  | "Pekerjaan 75%"
  | "Pekerjaan 100%/Go live"
  | "2 Bulan setelah Go live"
  | "Penyerahan Rencana Kerja"
  | "Procurement Hardware"
  | "Manpower Services";

export type TerminStatus =
  | "Paid"
  | "Invoiced"
  | "Due"
  | "Upcoming"
  | "Overdue"
  | "Pending";

export interface TerminInstallment {
  id: ID;
  projectCode: string;
  projectName: string;
  clientName: string;
  /** Sticker price of the project as a whole. */
  totalProjectValue: number;
  /** Billing scheme — "2x (70-30)", "3x (50-30-20)", "1x (100)", "5x (20-25-25-25-5)". */
  termOfPayment: string;
  installmentNo: number;
  installmentType: InstallmentType;
  percentage: number; // 0..100
  amountDue: number;
  /** Date the work milestone is expected to complete. */
  progressDueDate?: ISODate;
  /** Date the customer is contractually required to pay. */
  terminDueDate?: ISODate;
  /** Date the customer actually paid (if applicable). */
  paidAt?: ISODate;
  status: TerminStatus;
  notes?: string;
}
