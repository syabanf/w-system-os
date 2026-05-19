"use client";

import { create } from "zustand";
import type { ProjectCosting, VendorCostLine } from "@/domain/entities/ProjectCosting";
import type { TerminInstallment } from "@/domain/entities/ProjectTermin";
import type { Invoice } from "@/domain/entities/Invoice";
import type { JournalEntry } from "@/domain/entities/GeneralLedger";
import { mockProjectCosting } from "@/infrastructure/data/projectCosting.mock";
import { mockProjectTermin } from "@/infrastructure/data/projectTermin.mock";
import {
  applySchemeToAmount,
  parsePaymentScheme,
  type SchemeProposal,
} from "@/lib/paymentScheme";

const STORAGE_KEY = "wit-erp-os.commercial";

interface Persisted {
  costings: ProjectCosting[];
  termins: TerminInstallment[];
  generatedInvoices: Array<Invoice & { fromTerminId: string }>;
  generatedJournals: Array<JournalEntry & { fromTerminId: string }>;
  invoiceCounter: number;
  journalCounter: number;
}

function load(): Persisted {
  const fallback: Persisted = {
    costings: mockProjectCosting,
    termins: mockProjectTermin,
    generatedInvoices: [],
    generatedJournals: [],
    invoiceCounter: 52,
    journalCounter: 516,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      costings: parsed.costings ?? mockProjectCosting,
      termins: parsed.termins ?? mockProjectTermin,
      generatedInvoices: parsed.generatedInvoices ?? [],
      generatedJournals: parsed.generatedJournals ?? [],
      invoiceCounter: parsed.invoiceCounter ?? 52,
      journalCounter: parsed.journalCounter ?? 516,
    };
  } catch {
    return fallback;
  }
}

function persist(state: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

interface GeneratedInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  journalId: string;
  journalNumber: string;
}

interface CommercialState extends Persisted {
  // ProjectCosting
  updateCosting: (id: string, patch: Partial<ProjectCosting>) => void;
  updateVendor: (
    costingId: string,
    vendorIdx: number,
    patch: Partial<VendorCostLine>,
  ) => void;
  addCosting: (costing: Omit<ProjectCosting, "id">) => string;
  deleteCosting: (id: string) => void;
  bulkImportCostings: (rows: Omit<ProjectCosting, "id">[]) => number;

  // Termin
  updateTermin: (id: string, patch: Partial<TerminInstallment>) => void;
  addTermin: (termin: Omit<TerminInstallment, "id">) => string;
  deleteTermin: (id: string) => void;
  bulkImportTermins: (rows: Omit<TerminInstallment, "id">[]) => number;
  generateTerminsFromScheme: (args: {
    projectCode: string;
    projectName: string;
    clientName: string;
    totalProjectValue: number;
    scheme: string;
  }) => { generated: number; ids: string[] } | null;

  // Invoice / journal generation
  generateInvoiceFromTermin: (terminId: string) => GeneratedInvoiceResult | null;

  // Reset
  resetAll: () => void;
}

export const useCommercialStore = create<CommercialState>((set, get) => ({
  ...(typeof window === "undefined"
    ? {
        costings: mockProjectCosting,
        termins: mockProjectTermin,
        generatedInvoices: [],
        generatedJournals: [],
        invoiceCounter: 52,
        journalCounter: 516,
      }
    : load()),

  updateCosting: (id, patch) => {
    const s = get();
    const next: Persisted = {
      ...s,
      costings: s.costings.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
    };
    persist(next);
    set(next);
  },

  updateVendor: (costingId, vendorIdx, patch) => {
    const s = get();
    const next: Persisted = {
      ...s,
      costings: s.costings.map((c) => {
        if (c.id !== costingId) return c;
        const vendors = c.vendors.map((v, i) => (i === vendorIdx ? { ...v, ...patch } : v));
        return { ...c, vendors };
      }),
    };
    persist(next);
    set(next);
  },

  addCosting: (costing) => {
    const id = genId("pc");
    const s = get();
    const next: Persisted = {
      ...s,
      costings: [{ id, ...costing }, ...s.costings],
    };
    persist(next);
    set(next);
    return id;
  },

  deleteCosting: (id) => {
    const s = get();
    const next: Persisted = { ...s, costings: s.costings.filter((c) => c.id !== id) };
    persist(next);
    set(next);
  },

  bulkImportCostings: (rows) => {
    const s = get();
    const next: Persisted = {
      ...s,
      costings: [
        ...rows.map((r) => ({ id: genId("pc"), ...r }) as ProjectCosting),
        ...s.costings,
      ],
    };
    persist(next);
    set(next);
    return rows.length;
  },

  updateTermin: (id, patch) => {
    const s = get();
    const next: Persisted = {
      ...s,
      termins: s.termins.map((t) => (t.id === id ? { ...t, ...patch, id } : t)),
    };
    persist(next);
    set(next);
  },

  addTermin: (termin) => {
    const id = genId("tm");
    const s = get();
    const next: Persisted = { ...s, termins: [...s.termins, { id, ...termin }] };
    persist(next);
    set(next);
    return id;
  },

  deleteTermin: (id) => {
    const s = get();
    const next: Persisted = { ...s, termins: s.termins.filter((t) => t.id !== id) };
    persist(next);
    set(next);
  },

  bulkImportTermins: (rows) => {
    const s = get();
    const next: Persisted = {
      ...s,
      termins: [
        ...s.termins,
        ...rows.map((r) => ({ id: genId("tm"), ...r }) as TerminInstallment),
      ],
    };
    persist(next);
    set(next);
    return rows.length;
  },

  generateTerminsFromScheme: ({
    projectCode,
    projectName,
    clientName,
    totalProjectValue,
    scheme,
  }) => {
    const proposals = parsePaymentScheme(scheme);
    if (!proposals) return null;

    const amounts = applySchemeToAmount(totalProjectValue, proposals);
    const generated: TerminInstallment[] = proposals.map((p: SchemeProposal, i) => ({
      id: genId("tm"),
      projectCode,
      projectName,
      clientName,
      totalProjectValue,
      termOfPayment: scheme,
      installmentNo: p.installmentNo,
      installmentType: p.installmentType,
      percentage: p.percentage,
      amountDue: amounts[i] ?? 0,
      status: "Pending",
    }));

    const s = get();
    // Remove any existing termins for this project code first, to avoid dupes.
    const filtered = s.termins.filter((t) => t.projectCode !== projectCode);
    const next: Persisted = { ...s, termins: [...filtered, ...generated] };
    persist(next);
    set(next);
    return { generated: generated.length, ids: generated.map((g) => g.id) };
  },

  generateInvoiceFromTermin: (terminId) => {
    const s = get();
    const termin = s.termins.find((t) => t.id === terminId);
    if (!termin) return null;
    if (termin.status === "Paid") return null;
    // Already generated for this termin?
    const existing = s.generatedInvoices.find((i) => i.fromTerminId === terminId);
    if (existing) {
      const j = s.generatedJournals.find((j) => j.fromTerminId === terminId);
      if (j) {
        return {
          invoiceId: existing.id,
          invoiceNumber: existing.number,
          journalId: j.id,
          journalNumber: j.number,
        };
      }
    }

    const invoiceCounter = s.invoiceCounter + 1;
    const journalCounter = s.journalCounter + 1;
    const invoiceNumber = `INV-2026-${pad(invoiceCounter)}`;
    const journalNumber = `JE-2026-${pad(journalCounter)}`;
    const invoiceId = genId("inv");
    const journalId = genId("je");

    const today = new Date().toISOString().slice(0, 10);
    const grossAmount = termin.amountDue;
    // Indonesian PPN 11% — termin amount is treated as PPN-inclusive; revenue
    // and tax-payable derive from it.
    const revenuePortion = Math.round(grossAmount / 1.11);
    const ppnPortion = grossAmount - revenuePortion;

    const invoice: Invoice & { fromTerminId: string } = {
      id: invoiceId,
      number: invoiceNumber,
      clientId: "auto",
      projectId: termin.projectCode,
      issueDate: today,
      dueDate: termin.terminDueDate ?? today,
      amount: grossAmount,
      paidAmount: 0,
      status: "sent",
      currency: "IDR",
      notes: `Auto-generated from termin ${termin.installmentType} (${termin.percentage}%)`,
      fromTerminId: terminId,
    };

    const journal: JournalEntry & { fromTerminId: string } = {
      id: journalId,
      number: journalNumber,
      date: today,
      fiscalPeriod: today.slice(0, 7),
      description: `${invoiceNumber} — ${termin.projectName} (${termin.installmentType})`,
      source: "Invoice",
      sourceRef: invoiceNumber,
      status: "posted",
      postedBy: "System",
      postedAt: new Date().toISOString(),
      totalDebit: grossAmount,
      totalCredit: grossAmount,
      lines: [
        {
          id: genId("jl"),
          accountCode: "1020",
          accountName: "Accounts Receivable",
          description: "Recognize AR",
          debit: grossAmount,
          credit: 0,
        },
        {
          id: genId("jl"),
          accountCode: "4010",
          accountName: "Project Revenue",
          description: `${termin.installmentType} ${termin.percentage}%`,
          debit: 0,
          credit: revenuePortion,
        },
        {
          id: genId("jl"),
          accountCode: "2020",
          accountName: "PPN Payable",
          description: "VAT 11%",
          debit: 0,
          credit: ppnPortion,
        },
      ],
      fromTerminId: terminId,
    };

    const next: Persisted = {
      ...s,
      invoiceCounter,
      journalCounter,
      generatedInvoices: [...s.generatedInvoices, invoice],
      generatedJournals: [...s.generatedJournals, journal],
      termins: s.termins.map((t) =>
        t.id === terminId ? { ...t, status: "Invoiced" as const } : t,
      ),
    };
    persist(next);
    set(next);
    return { invoiceId, invoiceNumber, journalId, journalNumber };
  },

  resetAll: () => {
    const fresh: Persisted = {
      costings: mockProjectCosting,
      termins: mockProjectTermin,
      generatedInvoices: [],
      generatedJournals: [],
      invoiceCounter: 52,
      journalCounter: 516,
    };
    persist(fresh);
    set(fresh);
  },
}));
