"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, X } from "lucide-react";
import type {
  MilestoneSection,
  MilestoneStatus,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import type { ProjectMilestoneDraft } from "@/state/milestones.store";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { cn } from "@/lib/cn";

const STATUSES: ReadonlyArray<{ value: MilestoneStatus; label: string }> = [
  { value: "waiting-action", label: "Waiting action" },
  { value: "already-sent", label: "Already sent" },
  { value: "in-progress", label: "In progress" },
  { value: "approved", label: "Approved" },
  { value: "overdue", label: "Overdue" },
];

const SECTIONS: ReadonlyArray<{ value: MilestoneSection; label: string }> = [
  { value: "workflow", label: "Workflow" },
  { value: "payment", label: "Payment progress" },
  { value: "credential", label: "Credential data" },
  { value: "development", label: "Development data" },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Props {
  open: boolean;
  projectId: string;
  defaultSection?: MilestoneSection;
  editing?: ProjectMilestone | null;
  onClose: () => void;
  onSubmit: (draft: ProjectMilestoneDraft, editingId?: string) => void;
}

function emptyDraft(
  projectId: string,
  defaultSection: MilestoneSection,
): ProjectMilestoneDraft {
  const today = new Date();
  const due = new Date(today);
  due.setDate(today.getDate() + 14);
  return {
    projectId,
    section: defaultSection,
    kind: "",
    label: "",
    status: "waiting-action",
    dueDate: due.toISOString().slice(0, 10),
    driveLink: "",
    notes: "",
    ownerId: undefined,
  };
}

function fromMilestone(m: ProjectMilestone): ProjectMilestoneDraft {
  const { id: _id, ...rest } = m;
  void _id;
  return rest;
}

export function MilestoneFormDialog({
  open,
  projectId,
  defaultSection = "workflow",
  editing,
  onClose,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<ProjectMilestoneDraft>(() =>
    emptyDraft(projectId, defaultSection),
  );
  // Track whether the user has hand-edited `kind`; if they haven't we keep it
  // synced with the slug of `label`. Reset on dialog open.
  const [kindTouched, setKindTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft(fromMilestone(editing));
      setKindTouched(true);
    } else {
      setDraft(emptyDraft(projectId, defaultSection));
      setKindTouched(false);
    }
  }, [open, editing, projectId, defaultSection]);

  // Esc closes the dialog (Enter is handled natively by <form> onSubmit).
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

  const set = <K extends keyof ProjectMilestoneDraft>(
    key: K,
    value: ProjectMilestoneDraft[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const setLabel = (value: string) => {
    setDraft((d) => ({
      ...d,
      label: value,
      kind: kindTouched ? d.kind : slugify(value),
    }));
  };

  const driveLink = draft.driveLink ?? "";
  const isValidDriveLink =
    driveLink.length === 0 || /^https?:\/\/\S+/i.test(driveLink);

  const isValid =
    draft.label.trim().length > 0 &&
    draft.kind.trim().length > 0 &&
    isValidDriveLink;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    // Strip empty optional string fields so downstream code can `if (m.driveLink)` cleanly.
    const cleaned: ProjectMilestoneDraft = {
      ...draft,
      driveLink: driveLink.trim() ? driveLink.trim() : undefined,
      notes: draft.notes?.trim() ? draft.notes.trim() : undefined,
      dueDate: draft.dueDate || undefined,
      ownerId: draft.ownerId || undefined,
    };
    onSubmit(cleaned, editing?.id);
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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-zinc-100">
                <Flag className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit milestone" : "Create milestone"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.label : "New milestone"}
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
              <Field label="Label" required>
                <input
                  type="text"
                  value={draft.label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Project Brief"
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Section" required>
                  <select
                    value={draft.section}
                    onChange={(e) =>
                      set("section", e.target.value as MilestoneSection)
                    }
                    className={inputCls}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kind (slug)" required>
                  <input
                    type="text"
                    value={draft.kind}
                    onChange={(e) => {
                      setKindTouched(true);
                      set("kind", e.target.value);
                    }}
                    className={cn(inputCls, "font-mono")}
                    placeholder="project-brief"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      set("status", e.target.value as MilestoneStatus)
                    }
                    className={inputCls}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Due date">
                  <input
                    type="date"
                    value={draft.dueDate ?? ""}
                    onChange={(e) =>
                      set("dueDate", e.target.value || undefined)
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Drive link">
                  <input
                    type="url"
                    value={driveLink}
                    onChange={(e) => set("driveLink", e.target.value)}
                    className={cn(
                      inputCls,
                      !isValidDriveLink &&
                        "border-rose-400/60 focus:border-rose-400",
                    )}
                    placeholder="https://drive.google.com/..."
                    pattern="https?://.+"
                  />
                </Field>
                <Field label="Owner">
                  <select
                    value={draft.ownerId ?? ""}
                    onChange={(e) =>
                      set("ownerId", e.target.value || undefined)
                    }
                    className={inputCls}
                  >
                    <option value="">— Unassigned —</option>
                    {mockTeam.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  className={cn(inputCls, "min-h-[64px] resize-y")}
                  placeholder="Optional context for this milestone."
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
                  {editing ? "Save changes" : "Create milestone"}
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
