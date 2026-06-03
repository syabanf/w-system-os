"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListChecks, X } from "lucide-react";
import {
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/domain/entities/Task";
import type { TaskDraft } from "@/state/tasks.store";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockSprints } from "@/infrastructure/data/tasks.mock";
import { FormField } from "@/presentation/shared/FormField";
import { cn } from "@/lib/cn";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

interface Props {
  open: boolean;
  /** Default sprint to associate with new tasks (e.g. when adding from a
   *  selected sprint card). */
  defaultSprintId?: string;
  editing?: Task | null;
  onClose: () => void;
  onSubmit: (draft: TaskDraft, editingId?: string) => void;
}

function emptyDraft(defaultSprintId?: string): TaskDraft {
  const projectId = mockProjects[0]?.id ?? "pr-001";
  return {
    title: "",
    projectId,
    sprintId: defaultSprintId,
    status: "To Do",
    priority: "medium",
    storyPoints: 3,
    assigneeId: mockTeam[0]?.id ?? "tm-001",
    blocked: false,
    blockerReason: undefined,
    dueDate: undefined,
  };
}

function fromTask(t: Task): TaskDraft {
  const { id: _id, code, createdAt, ...rest } = t;
  void _id;
  return { ...rest, code, createdAt };
}

export function TaskFormDialog({
  open,
  defaultSprintId,
  editing,
  onClose,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<TaskDraft>(() => emptyDraft(defaultSprintId));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromTask(editing) : emptyDraft(defaultSprintId));
    setSubmitted(false);
  }, [open, editing, defaultSprintId]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.title.trim().length === 0) errors.title = "Required";
  if (draft.projectId.trim().length === 0) errors.projectId = "Required";
  if (draft.assigneeId.trim().length === 0) errors.assigneeId = "Required";
  if (!(draft.storyPoints >= 0)) errors.storyPoints = "Must be 0 or more";

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

  // Sprints filtered to the chosen project so the user can't accidentally
  // assign a task to a sprint that belongs to another engagement.
  const projectSprints = mockSprints.filter((s) => s.projectId === draft.projectId);

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                <ListChecks className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit task" : "Add task"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.code} · ${editing.title}` : "New sprint task"}
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
              <FormField label="Title" required error={submitted ? errors.title : undefined}>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                  aria-invalid={submitted && !!errors.title}
                  autoFocus
                  placeholder="Short, action-oriented summary"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Project" required error={submitted ? errors.projectId : undefined}>
                  <select
                    value={draft.projectId}
                    onChange={(e) => set("projectId", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.projectId}
                  >
                    {mockProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Sprint">
                  <select
                    value={draft.sprintId ?? ""}
                    onChange={(e) => set("sprintId", e.target.value || undefined)}
                    className={inputCls}
                  >
                    <option value="">— Unassigned (backlog)</option>
                    {projectSprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value as TaskStatus)}
                    className={inputCls}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select
                    value={draft.priority}
                    onChange={(e) => set("priority", e.target.value as TaskPriority)}
                    className={inputCls}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Story points" error={submitted ? errors.storyPoints : undefined}>
                  <input
                    type="number"
                    value={draft.storyPoints}
                    onChange={(e) => set("storyPoints", Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                    min={0}
                    step={1}
                    aria-invalid={submitted && !!errors.storyPoints}
                  />
                </FormField>
                <FormField label="Assignee" required error={submitted ? errors.assigneeId : undefined}>
                  <select
                    value={draft.assigneeId}
                    onChange={(e) => set("assigneeId", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.assigneeId}
                  >
                    {mockTeam.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Due date">
                  <input
                    type="date"
                    value={draft.dueDate?.slice(0, 10) ?? ""}
                    onChange={(e) => set("dueDate", e.target.value || undefined)}
                    className={inputCls}
                  />
                </FormField>
                <label className="mt-5 flex items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.blocked}
                    onChange={(e) => set("blocked", e.target.checked)}
                    className="h-3.5 w-3.5 accent-rose-400"
                  />
                  Blocked
                </label>
              </div>

              {draft.blocked ? (
                <FormField label="Blocker reason">
                  <textarea
                    value={draft.blockerReason ?? ""}
                    onChange={(e) => set("blockerReason", e.target.value || undefined)}
                    className={cn(inputCls, "min-h-[60px] resize-y")}
                    placeholder="What's preventing this task from moving?"
                  />
                </FormField>
              ) : null}

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
                  {editing ? "Save changes" : "Add task"}
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
