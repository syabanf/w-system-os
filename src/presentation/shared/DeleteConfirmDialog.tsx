"use client";

import { useEffect } from "react";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  /** Title shown at the top of the dialog. */
  title: string;
  /** One- or two-line description of what's about to be deleted. */
  description: string;
  /** Optional confirm button label override; defaults to "Delete". */
  confirmLabel?: string;
  /** When non-null/undefined the dialog is open. The value is just a sentinel. */
  open: unknown;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Shared destructive-confirm modal used across all CRUD-bearing modules.
 *  Renders nothing when `open` is falsy, so callers can drive it with a
 *  `confirmTarget` state and pass that object straight through. */
export function DeleteConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  open,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  // Esc closes; Enter confirms. Both match desktop OS norms and let the user
  // commit-or-bail with the keyboard alone — important since the modal steals
  // pointer focus.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dialog-in glass-strong w-full max-w-sm overflow-hidden rounded-2xl border border-white/12 p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-zinc-50">{title}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="mr-auto text-[9px] uppercase tracking-wider text-zinc-500">
            Esc to cancel · ⏎ to delete
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="press rounded-full px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/8 hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="press rounded-full bg-rose-500/80 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300/50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
