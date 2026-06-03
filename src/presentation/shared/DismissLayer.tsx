"use client";

import { useEffect } from "react";

/**
 * Transparent full-screen backdrop that dismisses a popover/panel on an outside
 * click or Escape — the same approach DesktopLauncher uses. Render it as a
 * sibling JUST BEFORE the panel, inside the panel's open branch.
 *
 * z-30 sits ABOVE the windows (WindowManager is a z-10 stacking context, so all
 * windows are contained below 30) and BELOW the top bar + panels (z-40) — so the
 * panel and its trigger stay clickable while everything else dismisses.
 */
export function DismissLayer({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return <div className="fixed inset-0 z-30" aria-hidden onClick={onDismiss} />;
}
