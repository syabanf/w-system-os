import type {
  PaymentRepository,
  PurchaseOrderRepository,
  ExpenseClaimRepository,
} from "@/domain/repositories/TransactionRepository";
import type { Payment, PurchaseOrder, ExpenseClaim } from "@/domain/entities/Transaction";
import {
  mockPayments,
  mockPurchaseOrders,
  mockExpenseClaims,
} from "@/infrastructure/data/transactions.mock";

export class MockPaymentRepository implements PaymentRepository {
  async getAll(): Promise<Payment[]> {
    return mockPayments;
  }
}

export class MockPurchaseOrderRepository implements PurchaseOrderRepository {
  async getAll(): Promise<PurchaseOrder[]> {
    return mockPurchaseOrders;
  }
  async getPendingApproval(): Promise<PurchaseOrder[]> {
    return mockPurchaseOrders.filter((p) => p.status === "pending-approval");
  }
}

export class MockExpenseClaimRepository implements ExpenseClaimRepository {
  async getAll(): Promise<ExpenseClaim[]> {
    return mockExpenseClaims;
  }
  async getPending(): Promise<ExpenseClaim[]> {
    return mockExpenseClaims.filter(
      (e) => e.status === "submitted" || e.status === "draft",
    );
  }
}
