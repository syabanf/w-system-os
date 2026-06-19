"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileSignature, X } from "lucide-react";
import type { POStatus, PurchaseOrder } from "@/domain/entities/Transaction";
import type { PurchaseOrderDraft } from "@/state/purchaseOrders.store";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { demoNow } from "@/lib/date";

const STATUSES: POStatus[] = [
  "draft",
  "pending-approval",
  "approved",
  "partially-received",
  "received",
  "cancelled",
];

interface Props {
  open: boolean;
  editing?: PurchaseOrder | null;
  onClose: () => void;
  onSubmit: (draft: PurchaseOrderDraft, editingId?: string) => void;
}

function emptyDraft(): PurchaseOrderDraft {
  const today = demoNow();
  const delivery = new Date(today);
  delivery.setDate(today.getDate() + 14);
  return {
    vendor: "",
    vendorContact: "",
    date: today.toISOString().slice(0, 10),
    deliveryDate: delivery.toISOString().slice(0, 10),
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    status: "draft",
    approverName: undefined,
    approvedAt: undefined,
    items: 1,
  };
}

function fromPO(p: PurchaseOrder): PurchaseOrderDraft {
  const { id: _id, number, ...rest } = p;
  void _id;
  return { ...rest, number };
}

export function POFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<PurchaseOrderDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromPO(editing) : emptyDraft());
    setSubmitted(false);
  }, [open, editing]);

  const set = <K extends keyof PurchaseOrderDraft>(key: K, value: PurchaseOrderDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Auto-compute total from subtotal + tax for convenience; user can still edit.
  useEffect(() => {
    setDraft((d) => ({ ...d, total: d.subtotal + d.taxAmount }));
  }, [open]);

  const errors: Record<string, string> = {};
  if (!draft.vendor.trim()) errors.vendor = "Required";
  if (!(draft.subtotal >= 0)) errors.subtotal = "Enter a number";
  if (!(draft.taxAmount >= 0)) errors.taxAmount = "Enter a number";
  if (!(draft.items >= 1)) errors.items = "Enter a number";

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
    const total = draft.subtotal + draft.taxAmount;
    onSubmit({ ...draft, total }, editing?.id);
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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300">
                <FileSignature className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit purchase order" : "Create purchase order"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.number : "New PO"}
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
                <FormField label="Vendor" required error={submitted ? errors.vendor : undefined}>
                  <input
                    type="text"
                    value={draft.vendor}
                    onChange={(e) => set("vendor", e.target.value)}
                    className={inputCls}
                    autoFocus
                    aria-invalid={submitted && !!errors.vendor}
                  />
                </FormField>
                <FormField label="Vendor contact">
                  <input
                    type="text"
                    value={draft.vendorContact}
                    onChange={(e) => set("vendorContact", e.target.value)}
                    className={inputCls}
                    placeholder="name @ email"
                  />
                </FormField>
                <FormField label="Issue date">
                  <input
                    type="date"
                    value={draft.date.slice(0, 10)}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Delivery date">
                  <input
                    type="date"
                    value={draft.deliveryDate.slice(0, 10)}
                    onChange={(e) => set("deliveryDate", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Subtotal" error={submitted ? errors.subtotal : undefined}>
                  <input
                    type="number"
                    value={draft.subtotal}
                    onChange={(e) => set("subtotal", Number(e.target.value) || 0)}
                    className={inputCls}
                    min={0}
                    step={100_000}
                    aria-invalid={submitted && !!errors.subtotal}
                  />
                </FormField>
                <FormField label="Tax" error={submitted ? errors.taxAmount : undefined}>
                  <input
                    type="number"
                    value={draft.taxAmount}
                    onChange={(e) => set("taxAmount", Number(e.target.value) || 0)}
                    className={inputCls}
                    min={0}
                    step={10_000}
                    aria-invalid={submitted && !!errors.taxAmount}
                  />
                </FormField>
                <FormField label="Line items" error={submitted ? errors.items : undefined}>
                  <input
                    type="number"
                    value={draft.items}
                    onChange={(e) => set("items", Math.max(1, Number(e.target.value) || 1))}
                    className={inputCls}
                    min={1}
                    aria-invalid={submitted && !!errors.items}
                  />
                </FormField>
                <FormField label="Status">
                  <SearchableSelect
                    value={draft.status}
                    onChange={(v) => set("status", v as POStatus)}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                    ariaLabel="Status"
                  />
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
                <div className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-zinc-300">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Total</span>
                  <div className="font-mono text-zinc-100">
                    {(draft.subtotal + draft.taxAmount).toLocaleString("id-ID")} IDR
                  </div>
                </div>
              </div>

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
                  {editing ? "Save changes" : "Create PO"}
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
