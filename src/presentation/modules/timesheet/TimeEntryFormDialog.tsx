"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import type { ApprovalStatus, TimesheetEntry } from "@/domain/entities/Timesheet";
import type { TimeEntryDraft } from "@/state/timesheet.store";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { cn } from "@/lib/cn";
import { demoDateInput } from "@/lib/date";

const APPROVAL_STATUSES: ApprovalStatus[] = ["draft", "submitted", "approved", "rejected"];

interface Props {
  open: boolean;
  editing?: TimesheetEntry | null;
  onClose: () => void;
  onSubmit: (draft: TimeEntryDraft, editingId?: string) => void;
}

function emptyDraft(): TimeEntryDraft {
  return {
    memberId: mockTeam[0]?.id ?? "tm-001",
    projectId: mockProjects[0]?.id ?? "pr-001",
    date: demoDateInput(),
    hours: 8,
    billable: true,
    description: "",
    approvalStatus: "draft",
  };
}

function fromEntry(e: TimesheetEntry): TimeEntryDraft {
  const { id: _id, ...rest } = e;
  void _id;
  return rest;
}

export function TimeEntryFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<TimeEntryDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromEntry(editing) : emptyDraft());
    setSubmitted(false);
  }, [open, editing]);

  const set = <K extends keyof TimeEntryDraft>(key: K, value: TimeEntryDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (!draft.memberId.trim()) errors.memberId = "Required";
  if (!draft.projectId.trim()) errors.projectId = "Required";
  if (!(draft.hours > 0 && draft.hours <= 24)) errors.hours = "Enter a number";

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Clock className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit time entry" : "Log time"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.date} · ${editing.hours}h` : "New time entry"}
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
                <FormField label="Member" required error={submitted ? errors.memberId : undefined}>
                  <SearchableSelect
                    value={draft.memberId}
                    onChange={(v) => set("memberId", v)}
                    options={mockTeam.map((m) => ({ value: m.id, label: m.name }))}
                    ariaLabel="Member"
                  />
                </FormField>
                <FormField label="Project" required error={submitted ? errors.projectId : undefined}>
                  <SearchableSelect
                    value={draft.projectId}
                    onChange={(v) => set("projectId", v)}
                    options={mockProjects.map((p) => ({
                      value: p.id,
                      label: `${p.code} · ${p.name}`,
                    }))}
                    ariaLabel="Project"
                  />
                </FormField>
                <FormField label="Date" required>
                  <input
                    type="date"
                    value={draft.date.slice(0, 10)}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                </FormField>
                <FormField label="Hours (0.25 step)" required error={submitted ? errors.hours : undefined}>
                  <input
                    type="number"
                    value={draft.hours}
                    onChange={(e) =>
                      set("hours", Math.max(0, Math.min(24, Number(e.target.value) || 0)))
                    }
                    className={inputCls}
                    min={0}
                    max={24}
                    step={0.25}
                    aria-invalid={submitted && !!errors.hours}
                  />
                </FormField>
                <FormField label="Approval status">
                  <SearchableSelect
                    value={draft.approvalStatus}
                    onChange={(v) => set("approvalStatus", v as ApprovalStatus)}
                    options={APPROVAL_STATUSES.map((s) => ({ value: s, label: s }))}
                    ariaLabel="Approval status"
                  />
                </FormField>
                <label className="mt-5 flex items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.billable}
                    onChange={(e) => set("billable", e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-400"
                  />
                  Billable to client
                </label>
              </div>

              <FormField label="Description / notes">
                <textarea
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={cn(inputCls, "min-h-[60px] resize-y")}
                  placeholder="What did you work on?"
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
                  {editing ? "Save changes" : "Log entry"}
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
