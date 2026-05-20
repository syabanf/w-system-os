"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { LEAD_STAGES, type Lead, type LeadSource, type LeadStage } from "@/domain/entities/Lead";
import type { LeadDraft } from "@/state/leads.store";
import { cn } from "@/lib/cn";

const SOURCES: LeadSource[] = ["Referral", "Website", "Outbound", "Event", "Partner", "Inbound"];

interface Props {
  open: boolean;
  editing?: Lead | null;
  onClose: () => void;
  onSubmit: (draft: LeadDraft, editingId?: string) => void;
}

function emptyDraft(): LeadDraft {
  return {
    companyName: "",
    contactPerson: "",
    contactEmail: "",
    dealValue: 0,
    stage: "New Lead",
    source: "Inbound",
    probability: 30,
    followUpDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    ownerId: "tm-citra",
    notes: "",
  };
}

function fromLead(l: Lead): LeadDraft {
  const { id: _id, createdAt, ...rest } = l;
  void _id;
  return { ...rest, createdAt };
}

export function LeadFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromLead(editing) : emptyDraft());
  }, [open, editing]);

  const set = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const isValid =
    draft.companyName.trim().length > 0 &&
    draft.contactPerson.trim().length > 0 &&
    draft.contactEmail.trim().length > 0;

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit lead" : "Create lead"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.companyName : "New lead"}
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
                <Field label="Company" required>
                  <input
                    type="text"
                    value={draft.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                </Field>
                <Field label="Contact person" required>
                  <input
                    type="text"
                    value={draft.contactPerson}
                    onChange={(e) => set("contactPerson", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Deal value (IDR)">
                  <input
                    type="number"
                    value={draft.dealValue}
                    onChange={(e) => set("dealValue", Number(e.target.value) || 0)}
                    className={inputCls}
                    step={50_000_000}
                  />
                </Field>
                <Field label="Stage">
                  <select
                    value={draft.stage}
                    onChange={(e) => set("stage", e.target.value as LeadStage)}
                    className={inputCls}
                  >
                    {LEAD_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Source">
                  <select
                    value={draft.source}
                    onChange={(e) => set("source", e.target.value as LeadSource)}
                    className={inputCls}
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Probability (0–100)">
                  <input
                    type="number"
                    value={draft.probability}
                    onChange={(e) =>
                      set("probability", Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className={inputCls}
                    min={0}
                    max={100}
                  />
                </Field>
                <Field label="Follow-up date">
                  <input
                    type="date"
                    value={draft.followUpDate.slice(0, 10)}
                    onChange={(e) => set("followUpDate", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Owner ID">
                  <input
                    type="text"
                    value={draft.ownerId}
                    onChange={(e) => set("ownerId", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  className={cn(inputCls, "min-h-[68px] resize-y")}
                  placeholder="Context, qualification questions, next steps…"
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
                  {editing ? "Save changes" : "Create lead"}
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
