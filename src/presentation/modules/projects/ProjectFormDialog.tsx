"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, X } from "lucide-react";
import type { Project } from "@/domain/entities/Project";
import { PROJECT_STATUSES, type ProjectStatus } from "@/domain/value-objects/ProjectStatus";
import type { RiskLevel } from "@/domain/value-objects/RiskLevel";
import type { ProjectDraft } from "@/state/projects.store";
import { FormField } from "@/presentation/shared/FormField";
import { demoDateInput } from "@/lib/date";

const RISKS: RiskLevel[] = ["low", "medium", "high", "critical"];
const HEALTHS: Project["health"][] = ["green", "amber", "red"];

interface Props {
  open: boolean;
  editing?: Project | null;
  initialName?: string;
  onClose: () => void;
  onSubmit: (draft: ProjectDraft, editingId?: string) => void;
}

function emptyDraft(): ProjectDraft {
  const today = demoDateInput();
  const inSixMonths = new Date(Date.now() + 180 * 86400_000).toISOString().slice(0, 10);
  return {
    name: "",
    clientId: "cl-001",
    status: "Discovery",
    progress: 0,
    budget: 0,
    actualCost: 0,
    riskLevel: "low",
    startDate: today,
    endDate: inSixMonths,
    projectManagerId: "tm-001",
    teamIds: [],
    health: "green",
    techStack: [],
    openTickets: 0,
    changeRequests: 0,
  };
}

function fromProject(p: Project): ProjectDraft {
  const { id: _id, code, ...rest } = p;
  void _id;
  return { ...rest, code };
}

export function ProjectFormDialog({ open, editing, initialName, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [techInput, setTechInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing ? fromProject(editing) : { ...emptyDraft(), name: initialName ?? "" },
    );
    setTechInput("");
    setSubmitted(false);
  }, [open, editing, initialName]);

  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.name.trim().length === 0) errors.name = "Required";
  if (draft.clientId.trim().length === 0) errors.clientId = "Required";
  if (draft.projectManagerId.trim().length === 0) errors.projectManagerId = "Required";

  const addTech = () => {
    const t = techInput.trim();
    if (!t) return;
    set("techStack", [...draft.techStack, t]);
    setTechInput("");
  };

  const removeTech = (t: string) => {
    set(
      "techStack",
      draft.techStack.filter((x) => x !== t),
    );
  };

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
                <Briefcase className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit project" : "Create project"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? `${editing.code} · ${editing.name}` : "New project"}
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
              <FormField label="Project name" required error={submitted ? errors.name : undefined}>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls}
                  aria-invalid={submitted && !!errors.name}
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
                <FormField label="PM ID" required error={submitted ? errors.projectManagerId : undefined}>
                  <input
                    type="text"
                    value={draft.projectManagerId}
                    onChange={(e) => set("projectManagerId", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.projectManagerId}
                  />
                </FormField>
                <FormField label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value as ProjectStatus)}
                    className={inputCls}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Health">
                  <select
                    value={draft.health}
                    onChange={(e) => set("health", e.target.value as Project["health"])}
                    className={inputCls}
                  >
                    {HEALTHS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Progress (%)">
                  <input
                    type="number"
                    value={draft.progress}
                    onChange={(e) =>
                      set("progress", Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className={inputCls}
                    min={0}
                    max={100}
                  />
                </FormField>
                <FormField label="Risk">
                  <select
                    value={draft.riskLevel}
                    onChange={(e) => set("riskLevel", e.target.value as RiskLevel)}
                    className={inputCls}
                  >
                    {RISKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Budget (IDR)">
                  <input
                    type="number"
                    value={draft.budget}
                    onChange={(e) => set("budget", Number(e.target.value) || 0)}
                    className={inputCls}
                    step={10_000_000}
                  />
                </FormField>
                <FormField label="Actual cost (IDR)">
                  <input
                    type="number"
                    value={draft.actualCost}
                    onChange={(e) => set("actualCost", Number(e.target.value) || 0)}
                    className={inputCls}
                    step={10_000_000}
                  />
                </FormField>
                <FormField label="Start date">
                  <input
                    type="date"
                    value={draft.startDate.slice(0, 10)}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="End date">
                  <input
                    type="date"
                    value={draft.endDate.slice(0, 10)}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>

              <FormField label="Tech stack">
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTech();
                        }
                      }}
                      placeholder="Next.js · then press Enter"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={addTech}
                      className="shrink-0 rounded-lg bg-white/10 px-3 text-[11px] text-zinc-200 hover:bg-white/15"
                    >
                      Add
                    </button>
                  </div>
                  {draft.techStack.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {draft.techStack.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => removeTech(t)}
                          className="group inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-zinc-200 hover:bg-rose-500/15 hover:text-rose-200"
                        >
                          {t}
                          <X className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
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
                  {editing ? "Save changes" : "Create project"}
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
