import type { Project } from "../entities/Project";
import type { Invoice } from "../entities/Invoice";

export function projectGrossMargin(project: Project): number {
  if (project.budget === 0) return 0;
  return ((project.budget - project.actualCost) / project.budget) * 100;
}

export function outstandingAmount(invoice: Invoice): number {
  return Math.max(0, invoice.amount - invoice.paidAmount);
}

export function totalOutstanding(invoices: Invoice[]): number {
  return invoices.reduce((sum, inv) => sum + outstandingAmount(inv), 0);
}

export function totalRevenue(invoices: Invoice[]): number {
  return invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
}
