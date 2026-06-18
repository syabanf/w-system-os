"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUp, Loader2, Trash2, UserRound, X } from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import {
  PROFILE_AVATAR_COLORS,
  PROFILE_STATUSES,
  statusMeta,
  useProfileStore,
  type Profile,
} from "@/state/profile.store";
import { Avatar } from "@/presentation/shared/Avatar";
import { FormField } from "@/presentation/shared/FormField";
import { cn } from "@/lib/cn";

const MAX_AVATAR = 256;

/** Read an image file, center-crop to a square and downscale to a small JPEG
 *  data URL so it stays well within the localStorage budget. */
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = MAX_AVATAR;
        canvas.height = MAX_AVATAR;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, sx, sy, min, min, 0, 0, MAX_AVATAR, MAX_AVATAR);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("decode failed"));
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Edit the signed-in user's display identity (name, role, org, photo, status,
 *  initials, tagline). Opened from the account menu / Settings; persisted via
 *  the profile store. */
export function ProfileDialog() {
  const open = useDesktopStore((s) => s.isProfileEditOpen);
  const close = useDesktopStore((s) => s.closeProfileEdit);
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);

  const [draft, setDraft] = useState<Profile>(profile);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setSubmitted(false);
      setBusy(false);
    }
  }, [open, profile]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const derivedInitials = draft.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the user re-pick the same file later
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      set("avatarImage", await fileToAvatar(file));
    } catch {
      // ignore decode/read errors — keep the existing avatar
    } finally {
      setBusy(false);
    }
  };

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
      avatarImage: draft.avatarImage,
      initials: draft.initials?.trim() ? draft.initials.trim() : undefined,
      status: draft.status,
      tagline: draft.tagline?.trim() ? draft.tagline.trim() : undefined,
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[8vh] backdrop-blur-md"
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
                  image={draft.avatarImage}
                  initials={draft.initials?.trim() || undefined}
                  statusColor={statusMeta(draft.status).color}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-50">
                    {draft.name.trim() || "Your name"}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {draft.role.trim() || "Your role"}
                    {draft.org.trim() ? ` · ${draft.org.trim()}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPickPhoto}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ImageUp className="h-3 w-3" />
                    )}
                    {draft.avatarImage ? "Change" : "Photo"}
                  </button>
                  {draft.avatarImage ? (
                    <button
                      type="button"
                      onClick={() => set("avatarImage", undefined)}
                      aria-label="Remove photo"
                      title="Remove photo"
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
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

              <FormField label="Tagline">
                <input
                  type="text"
                  value={draft.tagline ?? ""}
                  onChange={(e) => set("tagline", e.target.value)}
                  className={inputCls}
                  placeholder="Keeping delivery, finance, and people in sync."
                  maxLength={80}
                />
              </FormField>

              <FormField label="Availability">
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE_STATUSES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => set("status", s.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                        draft.status === s.id
                          ? "border-white/40 bg-white/10 text-zinc-50"
                          : "border-white/10 text-zinc-300 hover:bg-white/8",
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.label}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Initials">
                  <input
                    type="text"
                    value={draft.initials ?? ""}
                    onChange={(e) =>
                      set("initials", e.target.value.toUpperCase().slice(0, 3))
                    }
                    className={inputCls}
                    placeholder={derivedInitials || "DW"}
                    maxLength={3}
                  />
                </FormField>
                <FormField label="Avatar color">
                  <div className="flex flex-wrap gap-1.5">
                    {PROFILE_AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set("avatarColor", c)}
                        aria-label={`Use ${c}`}
                        className={cn(
                          "h-6 w-6 rounded-full ring-1 ring-white/20 transition-transform",
                          draft.avatarColor === c && "scale-110 ring-2 ring-white/80",
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </FormField>
              </div>

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
