"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ReceiptText, X } from "lucide-react";
import type {
  ExpenseCategory,
  ExpenseClaim,
  ExpenseStatus,
} from "@/domain/entities/Transaction";
import type { ExpenseClaimDraft } from "@/state/expenseClaims.store";
import { FormField } from "@/presentation/shared/FormField";
import { cn } from "@/lib/cn";

const CATEGORIES: ExpenseCategory[] = ["Travel", "Meals", "Software", "Equipment", "Marketing", "Other"];
const STATUSES: ExpenseStatus[] = ["draft", "submitted", "approved", "rejected", "reimbursed"];

interface Props {
  open: boolean;
  editing?: ExpenseClaim | null;
  onClose: () => void;
  onSubmit: (draft: ExpenseClaimDraft, editingId?: string) => void;
}

function emptyDraft(): ExpenseClaimDraft {
  return {
    employeeName: "",
    date: new Date().toISOString().slice(0, 10),
    category: "Travel",
    amount: 0,
    status: "draft",
    description: "",
    approverName: undefined,
    reimbursedAt: undefined,
  };
}

function fromClaim(c: ExpenseClaim): ExpenseClaimDraft {
  const { id: _id, number, ...rest } = c;
  void _id;
  return { ...rest, number };
}

export function ExpenseFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<ExpenseClaimDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromClaim(editing) : emptyDraft());
    setSubmitted(false);
  }, [open, editing]);

  const set = <K extends keyof ExpenseClaimDraft>(key: K, value: ExpenseClaimDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (!draft.employeeName.trim()) errors.employeeName = "Required";
  if (!(draft.amount > 0)) errors.amount = "Enter a number";
  if (!draft.description.trim()) errors.description = "Required";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() =>
        (e.currentTarget as HTMLFormElement)
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    onSubmit(draft, editing?.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[8vh] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
                <ReceiptText className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit expense claim" : "Submit expense claim"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.number : "New expense claim"}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                title="Close (Esc)"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Employee" required error={submitted ? errors.employeeName : undefined}>
                  <input
                    type="text"
                    value={draft.employeeName}
                    onChange={(e) => set("employeeName", e.target.value)}
                    className={inputCls}
                    autoFocus
                    aria-invalid={submitted && !!errors.employeeName}
                  />
                </FormField>
                <FormField label="Date">
                  <input
                    type="date"
                    value={draft.date.slice(0, 10)}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Category">
                  <select
                    value={draft.category}
                    onChange={(e) => set("category", e.target.value as ExpenseCategory)}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Amount" required error={submitted ? errors.amount : undefined}>
                  <input
                    type="number"
                    value={draft.amount}
                    onChange={(e) => set("amount", Number(e.target.value) || 0)}
                    className={inputCls}
                    min={0}
                    step={10_000}
                    aria-invalid={submitted && !!errors.amount}
                  />
                </FormField>
                <FormField label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value as ExpenseStatus)}
                    className={inputCls}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Approver">
                  <input
                    type="text"
                    value={draft.approverName ?? ""}
                    onChange={(e) => set("approverName", e.target.value || undefined)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </FormField>
              </div>

              <FormField label="Description" required error={submitted ? errors.description : undefined}>
                <textarea
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={cn(inputCls, "min-h-[60px] resize-y")}
                  placeholder="Business purpose + receipt reference"
                  aria-invalid={submitted && !!errors.description}
                />
              </FormField>

              <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
                <span className="mr-auto text-[9px] uppercase tracking-wider text-zinc-500">
                  Esc to close · Enter to save
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-white/85 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
                >
                  {editing ? "Save changes" : "Submit claim"}
                </button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-white/30 focus:bg-white/[0.06]";
