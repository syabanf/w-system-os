"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Receipt, X } from "lucide-react";
import type { Invoice } from "@/domain/entities/Invoice";
import type { InvoiceStatus } from "@/domain/value-objects/InvoiceStatus";
import type { InvoiceDraft } from "@/state/invoices.store";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { cn } from "@/lib/cn";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "void"];

interface Props {
  open: boolean;
  editing?: Invoice | null;
  onClose: () => void;
  onSubmit: (draft: InvoiceDraft, editingId?: string) => void;
}

function emptyDraft(): InvoiceDraft {
  const today = new Date();
  const due = new Date(today);
  due.setDate(today.getDate() + 30);
  return {
    clientId: mockClients[0]?.id ?? "cl-001",
    projectId: mockProjects[0]?.id ?? "pr-001",
    issueDate: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    amount: 0,
    paidAmount: 0,
    status: "draft",
    currency: "IDR",
    notes: "",
  };
}

function fromInvoice(i: Invoice): InvoiceDraft {
  const { id: _id, number, ...rest } = i;
  void _id;
  return { ...rest, number };
}

export function InvoiceFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<InvoiceDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromInvoice(editing) : emptyDraft());
  }, [open, editing]);

  const set = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const isValid =
    draft.amount > 0 &&
    draft.paidAmount >= 0 &&
    draft.paidAmount <= draft.amount &&
    draft.clientId.trim().length > 0 &&
    draft.projectId.trim().length > 0;

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
                <Receipt className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit invoice" : "Create invoice"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.number}` : "New invoice"}
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
                <Field label="Client" required>
                  <select
                    value={draft.clientId}
                    onChange={(e) => set("clientId", e.target.value)}
                    className={inputCls}
                  >
                    {mockClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Project" required>
                  <select
                    value={draft.projectId}
                    onChange={(e) => set("projectId", e.target.value)}
                    className={inputCls}
                  >
                    {mockProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Issue date">
                  <input
                    type="date"
                    value={draft.issueDate.slice(0, 10)}
                    onChange={(e) => set("issueDate", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Due date">
                  <input
                    type="date"
                    value={draft.dueDate.slice(0, 10)}
                    onChange={(e) => set("dueDate", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Amount" required>
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
                <Field label="Paid amount">
                  <input
                    type="number"
                    value={draft.paidAmount}
                    onChange={(e) => set("paidAmount", Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                    min={0}
                    step={100_000}
                  />
                </Field>
                <Field label="Currency">
                  <select
                    value={draft.currency}
                    onChange={(e) => set("currency", e.target.value as Invoice["currency"])}
                    className={inputCls}
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value as InvoiceStatus)}
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
                  placeholder="PO reference, line item breakdown, payment instructions…"
                />
              </Field>

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
                  disabled={!isValid}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors",
                    isValid
                      ? "bg-white/85 text-zinc-900 hover:bg-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {editing ? "Save changes" : "Create invoice"}
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
