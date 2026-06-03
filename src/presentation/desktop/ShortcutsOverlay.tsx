"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  items: Shortcut[];
}

const GROUPS: ReadonlyArray<ShortcutGroup> = [
  {
    title: "General",
    items: [
      { keys: ["⌘", "K"], label: "Open Spotlight search" },
      { keys: ["?"], label: "Toggle this sheet" },
      { keys: ["Esc"], label: "Close dialogs / menus" },
    ],
  },
  {
    title: "Windows",
    items: [
      { keys: ["⌘", "W"], label: "Close window" },
      { keys: ["⌘", "M"], label: "Minimize" },
      { keys: ["⌃", "←"], label: "Snap left" },
      { keys: ["⌃", "→"], label: "Snap right" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["Click"], label: "A dock icon to open an app" },
      { keys: ["Click"], label: "A breadcrumb to go back" },
    ],
  },
];

/**
 * Returns true when the keyboard event originated from a field where the user
 * is actively typing — we must not hijack the `?` key in those contexts.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // `?` is Shift+/ on most layouts. Ignore while typing.
      if (e.key === "?" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Move focus into the panel when it opens so Esc / screen readers work.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ y: -8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-zinc-100">
                <Keyboard className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  Help
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  Keyboard shortcuts
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Close (Esc)"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              {GROUPS.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <Row
                        key={`${group.title}-${item.label}`}
                        keys={item.keys}
                        label={item.label}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <footer className="flex items-center justify-between border-t border-white/8 bg-white/[0.02] px-5 py-2.5 text-[10px] text-zinc-500">
              <span>
                Press <Kbd>?</Kbd> anytime to toggle this sheet
              </span>
              <span>
                <Kbd>Esc</Kbd> to close
              </span>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
      <span className="text-xs text-zinc-200">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((k, i) => (
          <Kbd key={`${k}-${i}`}>{k}</Kbd>
        ))}
      </span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded bg-white/10 px-1.5 text-[10px] text-zinc-300">
      {children}
    </kbd>
  );
}
