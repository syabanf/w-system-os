import type { ID, ISODate } from "@/types/common";

export type PaymentType = "incoming" | "outgoing";
export type PaymentMethod = "Bank Transfer" | "Cash" | "Cheque" | "E-Wallet" | "Card";
export type PaymentStatus = "draft" | "cleared" | "reconciled" | "failed";

export interface Payment {
  id: ID;
  number: string;
  type: PaymentType;
  date: ISODate;
  amount: number;
  method: PaymentMethod;
  bankAccount: string;
  reference: string;
  clientId?: ID;
  vendor?: string;
  appliedToInvoiceId?: ID;
  status: PaymentStatus;
  notes?: string;
}

export type POStatus = "draft" | "pending-approval" | "approved" | "partially-received" | "received" | "cancelled";

export interface PurchaseOrder {
  id: ID;
  number: string;
  vendor: string;
  vendorContact: string;
  date: ISODate;
  deliveryDate: ISODate;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: POStatus;
  approverName?: string;
  approvedAt?: ISODate;
  items: number; // line item count
}

export type ExpenseCategory = "Travel" | "Meals" | "Software" | "Equipment" | "Marketing" | "Other";
export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "reimbursed";

export interface ExpenseClaim {
  id: ID;
  number: string;
  employeeName: string;
  date: ISODate;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  description: string;
  approverName?: string;
  reimbursedAt?: ISODate;
}
