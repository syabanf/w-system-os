import type {
  PaymentRepository,
  PurchaseOrderRepository,
  ExpenseClaimRepository,
} from "@/domain/repositories/TransactionRepository";
import type { InvoiceRepository } from "@/domain/repositories/InvoiceRepository";
import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { Payment, PurchaseOrder, ExpenseClaim } from "@/domain/entities/Transaction";
import type { Invoice } from "@/domain/entities/Invoice";
import { totalOutstanding, totalRevenue } from "@/domain/rules/profitability.rules";

export interface TransactionOverviewDTO {
  invoices: (Invoice & { clientName: string })[];
  payments: (Payment & { clientName?: string })[];
  purchaseOrders: PurchaseOrder[];
  expenseClaims: ExpenseClaim[];
  metrics: {
    invoicedThisMonth: number;
    collectedThisMonth: number;
    outstandingTotal: number;
    overdueCount: number;
    pendingPOValue: number;
    expensesAwaitingApproval: number;
  };
}

export class GetTransactionOverview {
  constructor(
    private invoices: InvoiceRepository,
    private payments: PaymentRepository,
    private purchaseOrders: PurchaseOrderRepository,
    private expenses: ExpenseClaimRepository,
    private clients: ClientRepository,
  ) {}

  async execute(): Promise<TransactionOverviewDTO> {
    const [allInvoices, outstanding, allPayments, allPOs, allExpenses, allClients] =
      await Promise.all([
        this.invoices.getAll(),
        this.invoices.getOutstanding(),
        this.payments.getAll(),
        this.purchaseOrders.getAll(),
        this.expenses.getAll(),
        this.clients.getAll(),
      ]);

    const clientMap = new Map(allClients.map((c) => [c.id, c.name]));

    const invoices = allInvoices.map((i) => ({
      ...i,
      clientName: clientMap.get(i.clientId) ?? "Unknown",
    }));

    const payments = allPayments.map((p) => ({
      ...p,
      clientName: p.clientId ? clientMap.get(p.clientId) : undefined,
    }));

    const invoicedThisMonth = allInvoices
      .filter((i) => i.issueDate.startsWith("2026-05"))
      .reduce((s, i) => s + i.amount, 0);
    const collectedThisMonth = totalRevenue(
      allInvoices.filter((i) => i.issueDate.startsWith("2026-05")),
    );
    const outstandingTotal = totalOutstanding(outstanding);
    const overdueCount = allInvoices.filter((i) => i.status === "overdue").length;
    const pendingPOValue = allPOs
      .filter((p) => p.status === "pending-approval" || p.status === "draft")
      .reduce((s, p) => s + p.total, 0);
    const expensesAwaitingApproval = allExpenses
      .filter((e) => e.status === "submitted")
      .reduce((s, e) => s + e.amount, 0);

    return {
      invoices,
      payments,
      purchaseOrders: allPOs,
      expenseClaims: allExpenses,
      metrics: {
        invoicedThisMonth,
        collectedThisMonth,
        outstandingTotal,
        overdueCount,
        pendingPOValue,
        expensesAwaitingApproval,
      },
    };
  }
}
