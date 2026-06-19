"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type {
  Performance360Status,
  Performance360Template,
} from "@/infrastructure/data/performance360.mock";
import type { PerformanceTemplateDraft } from "@/state/performanceTemplates.store";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { cn } from "@/lib/cn";
import { DEMO_YEAR } from "@/lib/date";

type PeriodKind = Performance360Template["periodKind"];

const PERIOD_KINDS: PeriodKind[] = ["annual", "semester", "quarterly", "custom"];
const STATUSES: Performance360Status[] = ["draft", "active", "closed", "archived"];

interface Draft {
  name: string;
  description: string;
  periodKind: PeriodKind;
  periodYear: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  ratingScaleMax: string;
  status: Performance360Status;
}

function emptyDraft(): Draft {
  const year = DEMO_YEAR;
  return {
    name: "",
    description: "",
    periodKind: "semester",
    periodYear: String(year),
    periodLabel: `H1 ${year}`,
    periodStart: `${year}-01-01`,
    periodEnd: `${year}-06-30`,
    ratingScaleMax: "5",
    status: "draft",
  };
}

function fromTemplate(t: Performance360Template): Draft {
  return {
    name: t.name,
    description: t.description,
    periodKind: t.periodKind,
    periodYear: String(t.periodYear),
    periodLabel: t.periodLabel,
    periodStart: t.periodStart,
    periodEnd: t.periodEnd,
    ratingScaleMax: String(t.ratingScaleMax),
    status: t.status,
  };
}

interface Props {
  open: boolean;
  editing?: Performance360Template | null;
  onClose: () => void;
  onSubmit: (draft: PerformanceTemplateDraft, editingId?: string) => void;
}

export function TemplateFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromTemplate(editing) : emptyDraft());
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.name.trim().length === 0) errors.name = "Required";
  if (draft.periodLabel.trim().length === 0) errors.periodLabel = "Required";

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
    onSubmit(
      {
        name: draft.name.trim(),
        description: draft.description.trim(),
        periodKind: draft.periodKind,
        periodYear: Number(draft.periodYear) || DEMO_YEAR,
        periodLabel: draft.periodLabel.trim(),
        periodStart: draft.periodStart,
        periodEnd: draft.periodEnd,
        ratingScaleMax: Number(draft.ratingScaleMax) || 5,
        status: draft.status,
      },
      editing?.id,
    );
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
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit template" : "Create template"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.name : "New 360 template"}
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
              <FormField label="Name" required error={submitted ? errors.name : undefined}>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. H1 2026 360 Review"
                  aria-invalid={submitted && !!errors.name}
                  autoFocus
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={cn(inputCls, "min-h-[56px] resize-y")}
                  placeholder="What this cycle covers."
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Period label" required error={submitted ? errors.periodLabel : undefined}>
                  <input
                    type="text"
                    value={draft.periodLabel}
                    onChange={(e) => set("periodLabel", e.target.value)}
                    className={inputCls}
                    placeholder="H1 2026"
                    aria-invalid={submitted && !!errors.periodLabel}
                  />
                </FormField>
                <FormField label="Period kind">
                  <SearchableSelect
                    value={draft.periodKind}
                    onChange={(v) => set("periodKind", v as PeriodKind)}
                    options={PERIOD_KINDS.map((k) => ({ value: k, label: k }))}
                    ariaLabel="Period kind"
                  />
                </FormField>
                <FormField label="Period start">
                  <input
                    type="date"
                    value={draft.periodStart}
                    onChange={(e) => set("periodStart", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Period end">
                  <input
                    type="date"
                    value={draft.periodEnd}
                    onChange={(e) => set("periodEnd", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Year">
                  <input
                    type="number"
                    value={draft.periodYear}
                    onChange={(e) => set("periodYear", e.target.value)}
                    className={cn(inputCls, "font-mono")}
                  />
                </FormField>
                <FormField label="Rating scale max">
                  <input
                    type="number"
                    value={draft.ratingScaleMax}
                    onChange={(e) => set("ratingScaleMax", e.target.value)}
                    className={cn(inputCls, "font-mono")}
                  />
                </FormField>
              </div>

              <FormField label="Status">
                <SearchableSelect
                  value={draft.status}
                  onChange={(v) => set("status", v as Performance360Status)}
                  options={STATUSES.map((s) => ({ value: s, label: s }))}
                  ariaLabel="Status"
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
                  {editing ? "Save changes" : "Create template"}
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
