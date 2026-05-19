"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { useToastStore, type ToastTone } from "@/state/toast.store";
import { cn } from "@/lib/cn";

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
  error: <XCircle className="h-4 w-4 text-rose-300" />,
  info: <Info className="h-4 w-4 text-sky-300" />,
  warning: <TriangleAlert className="h-4 w-4 text-amber-300" />,
};

const TONE_ACCENT: Record<ToastTone, string> = {
  success: "before:bg-emerald-400/70",
  error: "before:bg-rose-400/70",
  info: "before:bg-sky-400/70",
  warning: "before:bg-amber-400/70",
};

/**
 * Renders the stack of active toasts. Mount once near the root of the shell.
 * The store is the single source of truth; this component just paints it.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={cn(
              "glass-strong pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-white/12 px-3 py-2.5 pl-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]",
              "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
              TONE_ACCENT[t.tone],
            )}
            role="status"
          >
            <span className="mt-0.5 shrink-0">{TONE_ICON[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-zinc-50">{t.title}</div>
              {t.description ? (
                <div className="mt-0.5 text-[11px] text-zinc-300">{t.description}</div>
              ) : null}
            </div>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-zinc-100 hover:bg-white/15"
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
