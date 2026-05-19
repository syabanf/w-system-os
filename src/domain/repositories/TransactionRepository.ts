import type { Payment, PurchaseOrder, ExpenseClaim } from "../entities/Transaction";

export interface PaymentRepository {
  getAll(): Promise<Payment[]>;
}

export interface PurchaseOrderRepository {
  getAll(): Promise<PurchaseOrder[]>;
  getPendingApproval(): Promise<PurchaseOrder[]>;
}

export interface ExpenseClaimRepository {
  getAll(): Promise<ExpenseClaim[]>;
  getPending(): Promise<ExpenseClaim[]>;
}
