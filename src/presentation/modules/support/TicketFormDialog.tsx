"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy, X } from "lucide-react";
import type { Ticket } from "@/domain/entities/Ticket";
import {
  TICKET_STATUSES,
  type TicketSeverity,
  type TicketStatus,
} from "@/domain/value-objects/TicketSeverity";
import type { TicketDraft } from "@/state/tickets.store";
import { FormField } from "@/presentation/shared/FormField";

const SEVERITIES: TicketSeverity[] = ["low", "medium", "high", "critical"];

interface Props {
  open: boolean;
  editing?: Ticket | null;
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (draft: TicketDraft, editingId?: string) => void;
}

function emptyDraft(): TicketDraft {
  return {
    title: "",
    clientId: "cl-001",
    projectId: "pr-001",
    severity: "medium",
    status: "Open",
    assignedToId: "tm-fahmi",
    isChangeRequest: false,
    estimatedEffortHours: 4,
  };
}

function fromTicket(t: Ticket): TicketDraft {
  const { id: _id, code, createdAt, slaDeadline, ...rest } = t;
  void _id;
  return { ...rest, code, createdAt, slaDeadline };
}

export function TicketFormDialog({ open, editing, initialTitle, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<TicketDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromTicket(editing) : { ...emptyDraft(), title: initialTitle ?? "" });
    setSubmitted(false);
  }, [open, editing, initialTitle]);

  const set = <K extends keyof TicketDraft>(key: K, value: TicketDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.title.trim().length === 0) errors.title = "Required";
  if (draft.clientId.trim().length === 0) errors.clientId = "Required";
  if (draft.projectId.trim().length === 0) errors.projectId = "Required";
  if (draft.assignedToId.trim().length === 0) errors.assignedToId = "Required";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      const form = e.currentTarget as HTMLFormElement;
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit ticket" : "Create ticket"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.code} · ${editing.title}` : "New ticket"}
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
              <FormField label="Title" required error={submitted ? errors.title : undefined}>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                  placeholder="Short summary of the issue"
                  aria-invalid={submitted && !!errors.title}
                  autoFocus
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Client ID" required error={submitted ? errors.clientId : undefined}>
                  <input
                    type="text"
                    value={draft.clientId}
                    onChange={(e) => set("clientId", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.clientId}
                  />
                </FormField>
                <FormField label="Project ID" required error={submitted ? errors.projectId : undefined}>
                  <input
                    type="text"
                    value={draft.projectId}
                    onChange={(e) => set("projectId", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.projectId}
                  />
                </FormField>
                <FormField label="Severity">
                  <select
                    value={draft.severity}
                    onChange={(e) => set("severity", e.target.value as TicketSeverity)}
                    className={inputCls}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value as TicketStatus)}
                    className={inputCls}
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Assignee ID" required error={submitted ? errors.assignedToId : undefined}>
                  <input
                    type="text"
                    value={draft.assignedToId}
                    onChange={(e) => set("assignedToId", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.assignedToId}
                  />
                </FormField>
                <FormField label="Estimated effort (h)">
                  <input
                    type="number"
                    value={draft.estimatedEffortHours ?? 0}
                    onChange={(e) =>
                      set("estimatedEffortHours", Number(e.target.value) || 0)
                    }
                    className={inputCls}
                    min={0}
                    step={0.5}
                  />
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={draft.isChangeRequest}
                  onChange={(e) => set("isChangeRequest", e.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-400"
                />
                Treat as change request (not incident)
              </label>

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
                  {editing ? "Save changes" : "Create ticket"}
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
