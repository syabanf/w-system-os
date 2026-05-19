import type { ID, ISODate } from "@/types/common";
import type { InvoiceStatus } from "../value-objects/InvoiceStatus";

export interface Invoice {
  id: ID;
  number: string;
  clientId: ID;
  projectId: ID;
  issueDate: ISODate;
  dueDate: ISODate;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  currency: "IDR" | "USD";
  notes?: string;
}
