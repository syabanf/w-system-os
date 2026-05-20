"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, X } from "lucide-react";
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from "@/domain/entities/Transaction";
import type { PaymentDraft } from "@/state/payments.store";
import { cn } from "@/lib/cn";

const TYPES: PaymentType[] = ["incoming", "outgoing"];
const METHODS: PaymentMethod[] = ["Bank Transfer", "Cash", "Cheque", "E-Wallet", "Card"];
const STATUSES: PaymentStatus[] = ["draft", "cleared", "reconciled", "failed"];

interface Props {
  open: boolean;
  editing?: Payment | null;
  onClose: () => void;
  onSubmit: (draft: PaymentDraft, editingId?: string) => void;
}

function emptyDraft(): PaymentDraft {
  return {
    type: "incoming",
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    method: "Bank Transfer",
    bankAccount: "BCA · 123-456-7890",
    reference: "",
    clientId: "cl-001",
    vendor: "",
    appliedToInvoiceId: undefined,
    status: "draft",
    notes: "",
  };
}

function fromPayment(p: Payment): PaymentDraft {
  const { id: _id, number, ...rest } = p;
  void _id;
  return { ...rest, number };
}

export function PaymentFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<PaymentDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromPayment(editing) : emptyDraft());
  }, [open, editing]);

  const set = <K extends keyof PaymentDraft>(key: K, value: PaymentDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const isValid =
    draft.amount > 0 &&
    draft.reference.trim().length > 0 &&
    draft.bankAccount.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit payment" : "Record payment"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.number}` : "New payment entry"}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Direction">
                  <select
                    value={draft.type}
                    onChange={(e) => set("type", e.target.value as PaymentType)}
                    className={inputCls}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    value={draft.date.slice(0, 10)}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Amount (IDR)" required>
                  <input
                    type="number"
                    value={draft.amount}
                    onChange={(e) => set("amount", Number(e.target.value) || 0)}
                    className={inputCls}
                    min={0}
                    step={100_000}
                    autoFocus
                  />
                </Field>
                <Field label="Method">
                  <select
                    value={draft.method}
                    onChange={(e) => set("method", e.target.value as PaymentMethod)}
                    className={inputCls}
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Bank account" required>
                  <input
                    type="text"
                    value={draft.bankAccount}
                    onChange={(e) => set("bankAccount", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Reference" required>
                  <input
                    type="text"
                    value={draft.reference}
                    onChange={(e) => set("reference", e.target.value)}
                    className={inputCls}
                    placeholder="Bank ref / cheque no / receipt"
                  />
                </Field>
                <Field label={draft.type === "incoming" ? "Client ID" : "Vendor"}>
                  {draft.type === "incoming" ? (
                    <input
                      type="text"
                      value={draft.clientId ?? ""}
                      onChange={(e) => set("clientId", e.target.value || undefined)}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft.vendor ?? ""}
                      onChange={(e) => set("vendor", e.target.value)}
                      className={inputCls}
                    />
                  )}
                </Field>
                <Field label="Applied to invoice ID">
                  <input
                    type="text"
                    value={draft.appliedToInvoiceId ?? ""}
                    onChange={(e) => set("appliedToInvoiceId", e.target.value || undefined)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value as PaymentStatus)}
                    className={inputCls}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  className={cn(inputCls, "min-h-[60px] resize-y")}
                />
              </Field>

              <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors",
                    isValid
                      ? "bg-white/85 text-zinc-900 hover:bg-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {editing ? "Save changes" : "Record payment"}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> ·</span> : null}
      </span>
      {children}
    </label>
  );
}
