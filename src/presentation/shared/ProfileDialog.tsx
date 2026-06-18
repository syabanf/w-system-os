"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound, X } from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import {
  PROFILE_AVATAR_COLORS,
  useProfileStore,
  type Profile,
} from "@/state/profile.store";
import { Avatar } from "@/presentation/shared/Avatar";
import { FormField } from "@/presentation/shared/FormField";
import { cn } from "@/lib/cn";

/** Edit the signed-in user's display identity (name, role, org, avatar tile).
 *  Opened from the account menu / Settings; persisted via the profile store. */
export function ProfileDialog() {
  const open = useDesktopStore((s) => s.isProfileEditOpen);
  const close = useDesktopStore((s) => s.closeProfileEdit);
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);

  const [draft, setDraft] = useState<Profile>(profile);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setSubmitted(false);
    }
  }, [open, profile]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.name.trim().length === 0) errors.name = "Required";
  if (draft.role.trim().length === 0) errors.role = "Required";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    update({
      name: draft.name.trim(),
      role: draft.role.trim(),
      org: draft.org.trim(),
      avatarColor: draft.avatarColor,
    });
    close();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[10vh] backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-zinc-100">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  Edit profile
                </div>
                <div className="text-sm font-semibold text-zinc-50">Your identity</div>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={draft.name || "?"}
                  color={draft.avatarColor}
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-50">
                    {draft.name.trim() || "Your name"}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {draft.role.trim() || "Your role"}
                    {draft.org.trim() ? ` · ${draft.org.trim()}` : ""}
                  </div>
                </div>
              </div>

              <FormField label="Full name" required error={submitted ? errors.name : undefined}>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls}
                  placeholder="Damar Wicaksono"
                  aria-invalid={submitted && !!errors.name}
                  autoFocus
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Role" required error={submitted ? errors.role : undefined}>
                  <input
                    type="text"
                    value={draft.role}
                    onChange={(e) => set("role", e.target.value)}
                    className={inputCls}
                    placeholder="Director of Operations"
                    aria-invalid={submitted && !!errors.role}
                  />
                </FormField>
                <FormField label="Organization">
                  <input
                    type="text"
                    value={draft.org}
                    onChange={(e) => set("org", e.target.value)}
                    className={inputCls}
                    placeholder="WIT.ID"
                  />
                </FormField>
              </div>

              <FormField label="Avatar color">
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE_AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("avatarColor", c)}
                      aria-label={`Use ${c}`}
                      className={cn(
                        "h-7 w-7 rounded-full ring-1 ring-white/20 transition-transform",
                        draft.avatarColor === c && "scale-110 ring-2 ring-white/80",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </FormField>

              <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-white/85 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
                >
                  Save profile
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
