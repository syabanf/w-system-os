import type { ChartOfAccount, JournalEntry } from "@/domain/entities/GeneralLedger";

export const mockChartOfAccounts: ChartOfAccount[] = [
  // Assets
  { id: "coa-1000", code: "1000", name: "Current Assets", type: "asset", subType: "Group", isGroup: true, balanceType: "debit", balance: 0, isActive: true },
  { id: "coa-1010", code: "1010", name: "Cash · BCA Operating", type: "asset", subType: "Cash", parentId: "coa-1000", isGroup: false, balanceType: "debit", balance: 3_240_000_000, isActive: true },
  { id: "coa-1011", code: "1011", name: "Cash · BCA Payroll", type: "asset", subType: "Cash", parentId: "coa-1000", isGroup: false, balanceType: "debit", balance: 850_000_000, isActive: true },
  { id: "coa-1020", code: "1020", name: "Accounts Receivable", type: "asset", subType: "AR", parentId: "coa-1000", isGroup: false, balanceType: "debit", balance: 1_960_000_000, isActive: true, description: "Outstanding client invoices" },
  { id: "coa-1030", code: "1030", name: "Prepaid Software", type: "asset", subType: "Prepaid", parentId: "coa-1000", isGroup: false, balanceType: "debit", balance: 145_000_000, isActive: true },
  { id: "coa-1100", code: "1100", name: "Fixed Assets", type: "asset", subType: "Group", isGroup: true, balanceType: "debit", balance: 0, isActive: true },
  { id: "coa-1110", code: "1110", name: "Office Equipment", type: "asset", subType: "Equipment", parentId: "coa-1100", isGroup: false, balanceType: "debit", balance: 420_000_000, isActive: true },
  { id: "coa-1120", code: "1120", name: "Accumulated Depreciation", type: "asset", subType: "Depreciation", parentId: "coa-1100", isGroup: false, balanceType: "credit", balance: -95_000_000, isActive: true },

  // Liabilities
  { id: "coa-2000", code: "2000", name: "Current Liabilities", type: "liability", subType: "Group", isGroup: true, balanceType: "credit", balance: 0, isActive: true },
  { id: "coa-2010", code: "2010", name: "Accounts Payable", type: "liability", subType: "AP", parentId: "coa-2000", isGroup: false, balanceType: "credit", balance: 380_000_000, isActive: true },
  { id: "coa-2020", code: "2020", name: "PPN Payable", type: "liability", subType: "Tax", parentId: "coa-2000", isGroup: false, balanceType: "credit", balance: 215_600_000, isActive: true },
  { id: "coa-2030", code: "2030", name: "PPh 21 Payable", type: "liability", subType: "Tax", parentId: "coa-2000", isGroup: false, balanceType: "credit", balance: 86_300_000, isActive: true },
  { id: "coa-2040", code: "2040", name: "BPJS Payable", type: "liability", subType: "Tax", parentId: "coa-2000", isGroup: false, balanceType: "credit", balance: 42_100_000, isActive: true },

  // Equity
  { id: "coa-3000", code: "3000", name: "Equity", type: "equity", subType: "Group", isGroup: true, balanceType: "credit", balance: 0, isActive: true },
  { id: "coa-3010", code: "3010", name: "Owner Capital", type: "equity", subType: "Capital", parentId: "coa-3000", isGroup: false, balanceType: "credit", balance: 2_500_000_000, isActive: true },
  { id: "coa-3020", code: "3020", name: "Retained Earnings", type: "equity", subType: "Retained", parentId: "coa-3000", isGroup: false, balanceType: "credit", balance: 1_840_000_000, isActive: true },

  // Revenue
  { id: "coa-4000", code: "4000", name: "Revenue", type: "revenue", subType: "Group", isGroup: true, balanceType: "credit", balance: 0, isActive: true },
  { id: "coa-4010", code: "4010", name: "Project Revenue", type: "revenue", subType: "Services", parentId: "coa-4000", isGroup: false, balanceType: "credit", balance: 8_950_000_000, isActive: true },
  { id: "coa-4020", code: "4020", name: "Retainer Revenue", type: "revenue", subType: "Services", parentId: "coa-4000", isGroup: false, balanceType: "credit", balance: 2_280_000_000, isActive: true },
  { id: "coa-4030", code: "4030", name: "Support Revenue", type: "revenue", subType: "Services", parentId: "coa-4000", isGroup: false, balanceType: "credit", balance: 620_000_000, isActive: true },

  // Expense
  { id: "coa-5000", code: "5000", name: "Operating Expenses", type: "expense", subType: "Group", isGroup: true, balanceType: "debit", balance: 0, isActive: true },
  { id: "coa-5010", code: "5010", name: "Salaries & Wages", type: "expense", subType: "Payroll", parentId: "coa-5000", isGroup: false, balanceType: "debit", balance: 4_120_000_000, isActive: true },
  { id: "coa-5020", code: "5020", name: "BPJS Company Share", type: "expense", subType: "Payroll", parentId: "coa-5000", isGroup: false, balanceType: "debit", balance: 184_000_000, isActive: true },
  { id: "coa-5030", code: "5030", name: "Software Subscriptions", type: "expense", subType: "Operating", parentId: "coa-5000", isGroup: false, balanceType: "debit", balance: 312_000_000, isActive: true },
  { id: "coa-5040", code: "5040", name: "Cloud Infrastructure", type: "expense", subType: "Operating", parentId: "coa-5000", isGroup: false, balanceType: "debit", balance: 198_500_000, isActive: true },
  { id: "coa-5050", code: "5050", name: "Office Rent", type: "expense", subType: "Operating", parentId: "coa-5000", isGroup: false, balanceType: "debit", balance: 63_750_000, isActive: true },
  { id: "coa-5060", code: "5060", name: "Travel & Meals", type: "expense", subType: "Operating", parentId: "coa-5000", isGroup: false, balanceType: "debit", balance: 38_000_000, isActive: true },
];

export const mockJournalEntries: JournalEntry[] = [
  {
    id: "je-001", number: "JE-2026-0508", date: "2026-05-18", fiscalPeriod: "2026-05",
    description: "Garuda Finansial — payment received against INV-2026-0042",
    source: "Payment", sourceRef: "PAY-2026-0118", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-18T08:45:00Z",
    totalDebit: 420_000_000, totalCredit: 420_000_000,
    lines: [
      { id: "jl-001-a", accountCode: "1010", accountName: "Cash · BCA Operating", description: "Garuda payment", debit: 420_000_000, credit: 0 },
      { id: "jl-001-b", accountCode: "1020", accountName: "Accounts Receivable", description: "Clear AR", debit: 0, credit: 420_000_000 },
    ],
  },
  {
    id: "je-002", number: "JE-2026-0509", date: "2026-05-18", fiscalPeriod: "2026-05",
    description: "INV-2026-0048 issued to Garuda Finansial",
    source: "Invoice", sourceRef: "INV-2026-0048", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-18T09:15:00Z",
    totalDebit: 462_000_000, totalCredit: 462_000_000,
    lines: [
      { id: "jl-002-a", accountCode: "1020", accountName: "Accounts Receivable", description: "Recognize AR", debit: 462_000_000, credit: 0 },
      { id: "jl-002-b", accountCode: "4010", accountName: "Project Revenue", description: "May milestone", debit: 0, credit: 420_000_000 },
      { id: "jl-002-c", accountCode: "2020", accountName: "PPN Payable", description: "VAT 10%", debit: 0, credit: 42_000_000 },
    ],
  },
  {
    id: "je-003", number: "JE-2026-0510", date: "2026-05-17", fiscalPeriod: "2026-05",
    description: "Nusantara Retail — payment INV-2026-0049",
    source: "Payment", sourceRef: "PAY-2026-0119", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-17T16:45:00Z",
    totalDebit: 280_000_000, totalCredit: 280_000_000,
    lines: [
      { id: "jl-003-a", accountCode: "1010", accountName: "Cash · BCA Operating", description: "Bank deposit", debit: 280_000_000, credit: 0 },
      { id: "jl-003-b", accountCode: "1020", accountName: "Accounts Receivable", description: "Clear AR", debit: 0, credit: 280_000_000 },
    ],
  },
  {
    id: "je-004", number: "JE-2026-0511", date: "2026-05-17", fiscalPeriod: "2026-05",
    description: "AWS · May 2026 cloud infrastructure",
    source: "Expense", sourceRef: "PAY-2026-0098", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-17T11:20:00Z",
    totalDebit: 38_500_000, totalCredit: 38_500_000,
    lines: [
      { id: "jl-004-a", accountCode: "5040", accountName: "Cloud Infrastructure", description: "AWS May", debit: 38_500_000, credit: 0 },
      { id: "jl-004-b", accountCode: "1010", accountName: "Cash · BCA Operating", description: "Bank transfer to AWS SG", debit: 0, credit: 38_500_000 },
    ],
  },
  {
    id: "je-005", number: "JE-2026-0512", date: "2026-05-16", fiscalPeriod: "2026-05",
    description: "Payroll accrual — April 2026 closing adjustment",
    source: "Payroll", sourceRef: "PR-2026-04", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-16T17:30:00Z",
    totalDebit: 412_500_000, totalCredit: 412_500_000,
    lines: [
      { id: "jl-005-a", accountCode: "5010", accountName: "Salaries & Wages", description: "Gross salaries", debit: 412_500_000, credit: 0 },
      { id: "jl-005-b", accountCode: "2030", accountName: "PPh 21 Payable", description: "Withhold PPh 21", debit: 0, credit: 28_600_000 },
      { id: "jl-005-c", accountCode: "2040", accountName: "BPJS Payable", description: "Withhold BPJS share", debit: 0, credit: 14_300_000 },
      { id: "jl-005-d", accountCode: "1011", accountName: "Cash · BCA Payroll", description: "Net payouts", debit: 0, credit: 369_600_000 },
    ],
  },
  {
    id: "je-006", number: "JE-2026-0513", date: "2026-05-15", fiscalPeriod: "2026-05",
    description: "Linear seat upgrade — Q2",
    source: "Expense", sourceRef: "PAY-2026-0101", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-15T14:10:00Z",
    totalDebit: 4_900_000, totalCredit: 4_900_000,
    lines: [
      { id: "jl-006-a", accountCode: "5030", accountName: "Software Subscriptions", description: "Linear Q2", debit: 4_900_000, credit: 0 },
      { id: "jl-006-b", accountCode: "1010", accountName: "Cash · BCA Operating", description: "Corp card settlement", debit: 0, credit: 4_900_000 },
    ],
  },
  {
    id: "je-007", number: "JE-2026-0514", date: "2026-05-15", fiscalPeriod: "2026-05",
    description: "INV-2026-0038 — Selasar Health (paid)",
    source: "Invoice", sourceRef: "INV-2026-0038", status: "posted",
    postedBy: "Damar Wicaksono", postedAt: "2026-05-15T10:05:00Z",
    totalDebit: 264_000_000, totalCredit: 264_000_000,
    lines: [
      { id: "jl-007-a", accountCode: "1020", accountName: "Accounts Receivable", description: "Recognize AR", debit: 264_000_000, credit: 0 },
      { id: "jl-007-b", accountCode: "4010", accountName: "Project Revenue", description: "EMR milestone", debit: 0, credit: 240_000_000 },
      { id: "jl-007-c", accountCode: "2020", accountName: "PPN Payable", description: "VAT 10%", debit: 0, credit: 24_000_000 },
    ],
  },
  {
    id: "je-008", number: "JE-2026-0515", date: "2026-05-19", fiscalPeriod: "2026-05",
    description: "Datadog APM — pending approval",
    source: "Manual", sourceRef: "PO-2026-0044", status: "draft",
    totalDebit: 62_160_000, totalCredit: 62_160_000,
    lines: [
      { id: "jl-008-a", accountCode: "5040", accountName: "Cloud Infrastructure", description: "Datadog APM", debit: 56_000_000, credit: 0 },
      { id: "jl-008-b", accountCode: "2020", accountName: "PPN Payable", description: "VAT", debit: 6_160_000, credit: 0 },
      { id: "jl-008-c", accountCode: "2010", accountName: "Accounts Payable", description: "Vendor invoice", debit: 0, credit: 62_160_000 },
    ],
  },
];
