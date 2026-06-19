"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Plus, X } from "lucide-react";
import type {
  UserStory,
  UserStoryPriority,
  UserStoryStatus,
} from "@/domain/entities/UserStory";
import type { UserStoryDraft } from "@/state/userStories.store";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockEpics } from "@/infrastructure/data/epics.mock";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";

const STATUSES: UserStoryStatus[] = ["Backlog", "Ready", "In Progress", "Review", "Done"];
const PRIORITIES: UserStoryPriority[] = ["low", "medium", "high", "critical"];

interface Props {
  open: boolean;
  /** Pre-pick the epic when adding from inside an epic detail view. */
  defaultEpicId?: string;
  defaultProjectId?: string;
  editing?: UserStory | null;
  onClose: () => void;
  onSubmit: (draft: UserStoryDraft, editingId?: string) => void;
}

function emptyDraft(defaultEpicId?: string, defaultProjectId?: string): UserStoryDraft {
  // Resolve project from epic if only one of the two was provided — keeps the
  // dialog consistent when launched from an epic detail view.
  const epicMatch = defaultEpicId ? mockEpics.find((e) => e.id === defaultEpicId) : null;
  const projectId = defaultProjectId ?? epicMatch?.projectId ?? mockProjects[0]?.id ?? "pr-001";
  const epicId = defaultEpicId ?? mockEpics.find((e) => e.projectId === projectId)?.id ?? mockEpics[0]?.id ?? "ep-001";
  return {
    title: "",
    asA: "",
    iWant: "",
    soThat: "",
    epicId,
    projectId,
    status: "Backlog",
    priority: "medium",
    storyPoints: 3,
    acceptanceCriteria: [],
    ownerId: mockTeam[0]?.id ?? "tm-001",
  };
}

function fromStory(s: UserStory): UserStoryDraft {
  const { id: _id, code, ...rest } = s;
  void _id;
  return { ...rest, code };
}

export function StoryFormDialog({
  open,
  defaultEpicId,
  defaultProjectId,
  editing,
  onClose,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<UserStoryDraft>(() => emptyDraft(defaultEpicId, defaultProjectId));
  const [acInput, setAcInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromStory(editing) : emptyDraft(defaultEpicId, defaultProjectId));
    setAcInput("");
    setSubmitted(false);
  }, [open, editing, defaultEpicId, defaultProjectId]);

  const set = <K extends keyof UserStoryDraft>(key: K, value: UserStoryDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.title.trim().length === 0) errors.title = "Required";
  if (draft.asA.trim().length === 0) errors.asA = "Required";
  if (draft.iWant.trim().length === 0) errors.iWant = "Required";
  if (draft.soThat.trim().length === 0) errors.soThat = "Required";
  if (draft.epicId.trim().length === 0) errors.epicId = "Pick an epic";

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

  const addCriterion = () => {
    const v = acInput.trim();
    if (!v) return;
    set("acceptanceCriteria", [...draft.acceptanceCriteria, v]);
    setAcInput("");
  };

  const removeCriterion = (idx: number) => {
    set(
      "acceptanceCriteria",
      draft.acceptanceCriteria.filter((_, i) => i !== idx),
    );
  };

  // Filter epics to the chosen project so cross-project assignment isn't possible.
  const projectEpics = mockEpics.filter((e) => e.projectId === draft.projectId);

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-pink-500/15 text-pink-300">
                <FileText className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit user story" : "Create user story"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.code} · ${editing.title}` : "New user story"}
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
              <FormField label="Story title" required error={submitted ? errors.title : undefined}>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                  aria-invalid={submitted && !!errors.title}
                  autoFocus
                  placeholder="Search filter for unread tickets"
                />
              </FormField>

              {/* Classic "As a … I want … so that …" template */}
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="mb-2 text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                  User story
                </div>
                <div className="grid gap-2">
                  <label className="flex items-baseline gap-2 text-[11px] text-zinc-400">
                    <span className="w-12 shrink-0 font-mono text-zinc-500">As a</span>
                    <input
                      type="text"
                      value={draft.asA}
                      onChange={(e) => set("asA", e.target.value)}
                      className={inputCls}
                      placeholder="support agent"
                      aria-invalid={submitted && !!errors.asA}
                    />
                  </label>
                  <label className="flex items-baseline gap-2 text-[11px] text-zinc-400">
                    <span className="w-12 shrink-0 font-mono text-zinc-500">I want</span>
                    <input
                      type="text"
                      value={draft.iWant}
                      onChange={(e) => set("iWant", e.target.value)}
                      className={inputCls}
                      placeholder="to filter the queue by unread"
                      aria-invalid={submitted && !!errors.iWant}
                    />
                  </label>
                  <label className="flex items-baseline gap-2 text-[11px] text-zinc-400">
                    <span className="w-12 shrink-0 font-mono text-zinc-500">So that</span>
                    <input
                      type="text"
                      value={draft.soThat}
                      onChange={(e) => set("soThat", e.target.value)}
                      className={inputCls}
                      placeholder="I can triage faster after lunch"
                      aria-invalid={submitted && !!errors.soThat}
                    />
                  </label>
                </div>
                {submitted && (errors.asA || errors.iWant || errors.soThat) ? (
                  <span role="alert" className="mt-2 block text-[10px] font-medium text-rose-300">
                    Complete the As a / I want / So that statement
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Project" required>
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
                <FormField label="Epic" required error={submitted ? errors.epicId : undefined}>
                  <SearchableSelect
                    value={draft.epicId}
                    onChange={(v) => set("epicId", v)}
                    options={
                      projectEpics.length === 0
                        ? [{ value: "", label: "— No epics in this project" }]
                        : projectEpics.map((ep) => ({
                            value: ep.id,
                            label: `${ep.code} · ${ep.name}`,
                          }))
                    }
                    ariaLabel="Epic"
                  />
                </FormField>
                <FormField label="Status">
                  <SearchableSelect
                    value={draft.status}
                    onChange={(v) => set("status", v as UserStoryStatus)}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                    ariaLabel="Status"
                  />
                </FormField>
                <FormField label="Priority">
                  <SearchableSelect
                    value={draft.priority}
                    onChange={(v) => set("priority", v as UserStoryPriority)}
                    options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                    ariaLabel="Priority"
                  />
                </FormField>
                <FormField label="Story points">
                  <input
                    type="number"
                    value={draft.storyPoints}
                    onChange={(e) => set("storyPoints", Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                    min={0}
                    step={1}
                  />
                </FormField>
                <FormField label="Owner">
                  <SearchableSelect
                    value={draft.ownerId}
                    onChange={(v) => set("ownerId", v)}
                    options={mockTeam.map((m) => ({ value: m.id, label: m.name }))}
                    ariaLabel="Owner"
                  />
                </FormField>
              </div>

              <FormField label="Acceptance criteria">
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={acInput}
                      onChange={(e) => setAcInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCriterion();
                        }
                      }}
                      placeholder="Add criterion · press Enter"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={addCriterion}
                      className="shrink-0 rounded-lg bg-white/10 px-3 text-[11px] text-zinc-200 hover:bg-white/15"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  {draft.acceptanceCriteria.length > 0 ? (
                    <ul className="space-y-1">
                      {draft.acceptanceCriteria.map((c, i) => (
                        <li
                          key={i}
                          className="group flex items-start gap-2 rounded-lg bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-200"
                        >
                          <span className="font-mono text-[9px] text-zinc-500">{i + 1}.</span>
                          <span className="flex-1">{c}</span>
                          <button
                            type="button"
                            onClick={() => removeCriterion(i)}
                            className="text-zinc-400 transition-colors hover:text-rose-300"
                            aria-label="Remove criterion"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
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
                  {editing ? "Save changes" : "Create story"}
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
