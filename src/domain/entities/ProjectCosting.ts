import type { ID } from "@/types/common";

export type ProjectCostingStatus =
  | "Discovery"
  | "In Progress"
  | "Invoice Sent"
  | "Completed"
  | "On Hold"
  | "Cancelled";

export interface VendorCostLine {
  vendor: string;
  amount: number;
  /** Free-form notes — e.g. "WIT.SBY · subcontract", "Plabs · hardware". */
  note?: string;
}

export interface ProjectCosting {
  id: ID;
  projectCode: string;
  projectName: string;
  clientName: string;
  /** What the customer pays us. */
  totalValue: number;
  /** What we pay each vendor (up to N lines). */
  vendors: VendorCostLine[];
  status: ProjectCostingStatus;
  /** Client billing scheme — e.g. "3x (50-30-20)", "2x (70-30)". */
  termOfPaymentClient: string;
  /** Vendor billing scheme — how WE pay vendors. */
  termOfPaymentVendor?: string;
  /** Comma-separated owner name or PM. */
  ownerName: string;
}

/** Derived helpers — pure functions, no framework imports. */
export function totalVendorCost(p: ProjectCosting): number {
  return p.vendors.reduce((s, v) => s + v.amount, 0);
}

export function projectMargin(p: ProjectCosting): number {
  return p.totalValue - totalVendorCost(p);
}

export function projectMarginRatio(p: ProjectCosting): number {
  if (p.totalValue === 0) return 0;
  return (projectMargin(p) / p.totalValue) * 100;
}
