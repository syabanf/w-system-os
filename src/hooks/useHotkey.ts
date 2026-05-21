"use client";

import { useEffect } from "react";

interface HotkeyOptions {
  /** When false the listener is skipped (e.g. when a module isn't focused). */
  enabled?: boolean;
  /** Skip when the user is typing in an input/textarea/contenteditable. */
  ignoreInForm?: boolean;
}

/** Register a single keyboard shortcut at the document level. The combo string
 *  is space- or `+`-separated and matched case-insensitively, e.g. `"mod+n"`,
 *  `"esc"`, `"shift+/"`. `mod` resolves to Meta on macOS and Ctrl elsewhere.
 *
 *  Defaults: `enabled=true`, `ignoreInForm=true` — so a CRUD "New" shortcut
 *  doesn't fire while the user is typing in the create dialog. */
export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, opts: HotkeyOptions = {}) {
  const { enabled = true, ignoreInForm = true } = opts;
  useEffect(() => {
    if (!enabled) return;
    const target = combo.toLowerCase().split(/[+\s]+/).filter(Boolean);
    const mod = target.includes("mod");
    const shift = target.includes("shift");
    const alt = target.includes("alt") || target.includes("option");
    const key = target.find((k) => !["mod", "shift", "alt", "option", "meta", "ctrl"].includes(k));
    if (!key) return;

    const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

    const onKey = (e: KeyboardEvent) => {
      if (ignoreInForm) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
          // Allow Esc to still fire — many dialogs rely on it for close.
          if (key !== "escape" && key !== "esc") return;
        }
      }
      const modOk = !mod || (isMac ? e.metaKey : e.ctrlKey);
      const shiftOk = shift === e.shiftKey;
      const altOk = alt === e.altKey;
      // Normalize a couple of key aliases.
      const pressed = e.key.toLowerCase() === " " ? "space" : e.key.toLowerCase();
      const target = key === "esc" ? "escape" : key;
      if (modOk && shiftOk && altOk && pressed === target) {
        handler(e);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [combo, enabled, ignoreInForm, handler]);
}
