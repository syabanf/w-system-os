"use client";

import { Sparkles } from "lucide-react";
import { useReddieStore } from "@/state/reddie.store";
import { cn } from "@/lib/cn";

/** Floating Reddie launcher — sits above the dock at bottom-right.
 *  Hides itself when the chat is open (the chat anchors to the same spot). */
export function ReddieLauncher() {
  const isOpen = useReddieStore((s) => s.isOpen);
  const toggle = useReddieStore((s) => s.toggle);
  const unread = useReddieStore((s) => s.unreadFromBot);

  if (isOpen) return null;

  return (
    <button
      onClick={toggle}
      aria-label={unread > 0 ? `Reddie · ${unread} new` : "Open Reddie assistant"}
      title="Ask Reddie"
      style={{ position: "fixed", bottom: 104, right: 20 }}
      className={cn(
        "group z-50 grid h-12 w-12 place-items-center rounded-2xl",
        "bg-gradient-to-br from-rose-500 to-pink-500 text-white",
        "shadow-[0_14px_38px_-10px_rgba(244,63,94,0.65)]",
        "transition-transform hover:scale-105 active:scale-95",
        "animate-[reddie-pop_260ms_cubic-bezier(0.16,1,0.3,1)_both]",
      )}
    >
      {/* Animated halo so the FAB reads as "alive" without being noisy. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-rose-500/60 to-pink-500/40 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <Sparkles className="h-[22px] w-[22px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" strokeWidth={2.2} />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--bg-base)] bg-rose-600 text-[10px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 right-2 h-2 w-2 animate-[reddie-ping_2.2s_ease-in-out_infinite] rounded-full bg-white/80"
      />
    </button>
  );
}
