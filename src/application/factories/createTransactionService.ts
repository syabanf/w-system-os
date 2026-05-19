import { MockInvoiceRepository } from "@/infrastructure/repositories/mock/MockInvoiceRepository";
import { MockClientRepository } from "@/infrastructure/repositories/mock/MockClientRepository";
import {
  MockPaymentRepository,
  MockPurchaseOrderRepository,
  MockExpenseClaimRepository,
} from "@/infrastructure/repositories/mock/MockTransactionRepositories";
import { GetTransactionOverview } from "../use-cases/transaction/GetTransactionOverview";
import { TransactionService } from "../services/TransactionService";

export function createTransactionService(): TransactionService {
  return new TransactionService(
    new GetTransactionOverview(
      new MockInvoiceRepository(),
      new MockPaymentRepository(),
      new MockPurchaseOrderRepository(),
      new MockExpenseClaimRepository(),
      new MockClientRepository(),
    ),
  );
}
