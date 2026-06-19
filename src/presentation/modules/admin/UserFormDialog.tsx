"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, X } from "lucide-react";
import type { Role, UserAccount } from "@/domain/entities/User";
import type { UserDraft } from "@/state/users.store";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";

const ROLES: Role[] = [
  "Super Admin",
  "Director",
  "Project Manager",
  "Business Analyst",
  "Developer",
  "Finance",
  "Sales",
  "Client Viewer",
];

interface Props {
  open: boolean;
  editing?: UserAccount | null;
  onClose: () => void;
  onSubmit: (draft: UserDraft, editingId?: string) => void;
}

function emptyDraft(): UserDraft {
  return {
    memberId: "tm-001",
    email: "",
    role: "Developer",
    active: true,
  };
}

function fromUser(u: UserAccount): UserDraft {
  const { id: _id, lastLogin, ...rest } = u;
  void _id;
  return { ...rest, lastLogin };
}

export function UserFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<UserDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromUser(editing) : emptyDraft());
    setSubmitted(false);
  }, [open, editing]);

  const set = <K extends keyof UserDraft>(key: K, value: UserDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (!draft.email.trim()) errors.email = "Required";
  else if (!/\S+@\S+\.\S+/.test(draft.email)) errors.email = "Enter a valid email";
  if (!draft.memberId.trim()) errors.memberId = "Required";

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
            className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                <KeyRound className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit account" : "Provision account"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.email : "New user"}
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
              <FormField label="Email" required error={submitted ? errors.email : undefined}>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                  autoFocus
                  placeholder="user@wit.id"
                  aria-invalid={submitted && !!errors.email}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Team member ID" required error={submitted ? errors.memberId : undefined}>
                  <input
                    type="text"
                    value={draft.memberId}
                    onChange={(e) => set("memberId", e.target.value)}
                    className={inputCls}
                    placeholder="tm-001"
                    aria-invalid={submitted && !!errors.memberId}
                  />
                </FormField>
                <FormField label="Role">
                  <SearchableSelect
                    value={draft.role}
                    onChange={(v) => set("role", v as Role)}
                    options={ROLES.map((r) => ({ value: r, label: r }))}
                    ariaLabel="Role"
                  />
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-400"
                />
                Account active (uncheck to suspend)
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
                  {editing ? "Save changes" : "Create account"}
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
