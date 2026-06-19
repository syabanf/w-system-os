"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface MenuBarItem {
  label?: string;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  /** Render a divider instead of an item (label/onClick ignored). */
  separator?: boolean;
}

/** A macOS-style menu-bar dropdown: click to open, click an item / outside /
 *  Escape to close. Items are computed lazily so they reflect live state. */
export function MenuBarMenu({
  label,
  items,
}: {
  label: string;
  items: () => MenuBarItem[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const resolved = open ? items() : [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "rounded-md px-1.5 py-0.5 transition-colors",
          open ? "bg-white/10 text-zinc-100" : "hover:text-zinc-100",
        )}
      >
        {label}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="menu-surface absolute left-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-xl border border-white/10 py-1 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            {resolved.map((it, i) =>
              it.separator ? (
                <div key={i} className="my-1 h-px bg-white/8" />
              ) : (
                <button
                  key={i}
                  role="menuitem"
                  disabled={it.disabled}
                  onClick={() => {
                    setOpen(false);
                    it.onClick?.();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-8 px-3 py-1.5 text-left text-[12px] transition-colors",
                    it.disabled
                      ? "cursor-default text-zinc-600"
                      : it.danger
                        ? "text-rose-300 hover:bg-rose-500/10"
                        : "text-zinc-200 hover:bg-white/8 hover:text-zinc-50",
                  )}
                >
                  <span className="truncate">{it.label}</span>
                  {it.shortcut ? (
                    <span className="shrink-0 font-mono text-[10px] text-zinc-500">{it.shortcut}</span>
                  ) : null}
                </button>
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
