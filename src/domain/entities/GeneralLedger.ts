import type { ID, ISODate } from "@/types/common";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type AccountBalanceType = "debit" | "credit";

export interface ChartOfAccount {
  id: ID;
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  parentId?: ID;
  isGroup: boolean;
  balanceType: AccountBalanceType;
  balance: number; // current balance (signed)
  description?: string;
  isActive: boolean;
}

export type JournalStatus = "draft" | "posted" | "reversed";

export interface JournalLine {
  id: ID;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: ID;
  number: string;
  date: ISODate;
  fiscalPeriod: string;
  description: string;
  source: "Manual" | "Invoice" | "Payment" | "Payroll" | "Expense" | "Adjustment";
  sourceRef?: string;
  status: JournalStatus;
  postedBy?: string;
  postedAt?: ISODate;
  totalDebit: number;
  totalCredit: number;
  lines: JournalLine[];
}
