"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { LEAD_STAGES, type Lead, type LeadSource, type LeadStage } from "@/domain/entities/Lead";
import type { LeadDraft } from "@/state/leads.store";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { cn } from "@/lib/cn";

const SOURCES: LeadSource[] = ["Referral", "Website", "Outbound", "Event", "Partner", "Inbound"];

interface Props {
  open: boolean;
  editing?: Lead | null;
  /** Optional prefill for the company-name field on create (command-surface intent). */
  initialName?: string;
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

export function LeadFormDialog({ open, editing, initialName, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromLead(editing) : { ...emptyDraft(), companyName: initialName ?? "" });
  }, [open, editing, initialName]);

  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.companyName.trim().length === 0) errors.companyName = "Required";
  if (draft.contactPerson.trim().length === 0) errors.contactPerson = "Required";
  if (draft.contactEmail.trim().length === 0) errors.contactEmail = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail.trim()))
    errors.contactEmail = "Enter a valid email";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
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
                <FormField label="Company" required error={submitted ? errors.companyName : undefined}>
                  <input
                    type="text"
                    value={draft.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.companyName}
                    autoFocus
                  />
                </FormField>
                <FormField
                  label="Contact person"
                  required
                  error={submitted ? errors.contactPerson : undefined}
                >
                  <input
                    type="text"
                    value={draft.contactPerson}
                    onChange={(e) => set("contactPerson", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.contactPerson}
                  />
                </FormField>
                <FormField label="Email" required error={submitted ? errors.contactEmail : undefined}>
                  <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.contactEmail}
                  />
                </FormField>
                <FormField label="Deal value (IDR)">
                  <input
                    type="number"
                    value={draft.dealValue}
                    onChange={(e) => set("dealValue", Number(e.target.value) || 0)}
                    className={inputCls}
                    step={50_000_000}
                  />
                </FormField>
                <FormField label="Stage">
                  <SearchableSelect
                    value={draft.stage}
                    onChange={(v) => set("stage", v as LeadStage)}
                    options={LEAD_STAGES.map((s) => ({ value: s, label: s }))}
                    ariaLabel="Stage"
                  />
                </FormField>
                <FormField label="Source">
                  <SearchableSelect
                    value={draft.source}
                    onChange={(v) => set("source", v as LeadSource)}
                    options={SOURCES.map((s) => ({ value: s, label: s }))}
                    ariaLabel="Source"
                  />
                </FormField>
                <FormField label="Probability (0–100)">
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
                </FormField>
                <FormField label="Follow-up date">
                  <input
                    type="date"
                    value={draft.followUpDate.slice(0, 10)}
                    onChange={(e) => set("followUpDate", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Owner ID">
                  <input
                    type="text"
                    value={draft.ownerId}
                    onChange={(e) => set("ownerId", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  className={cn(inputCls, "min-h-[68px] resize-y")}
                  placeholder="Context, qualification questions, next steps…"
                />
              </FormField>

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
                  className="rounded-full bg-white/85 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
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
