"use client";

import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { DrillBreadcrumb, type Crumb } from "./DrillBreadcrumb";
import { cn } from "@/lib/cn";

interface DrillHeaderProps {
  crumbs: Crumb[];
  /** Jump to an ancestor crumb by index (same contract as DrillBreadcrumb). */
  onJump: (level: number) => void;
  /** Step back exactly one drill level. Also bound to Esc / ⌘[ / Ctrl+[. */
  onBack: () => void;
  /** Context-aware label, e.g. "Back to projects". */
  backLabel?: string;
  ariaLabel?: string;
  className?: string;
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Standard drill header: a context-aware "← Back" button next to the shared
 * breadcrumb, plus app-wide keyboard back (⌘[ / Ctrl+[ anytime; Esc when no
 * dialog is open, so modals keep owning Esc). Mounted only while drilled, so the
 * shortcut is scoped to the drill context.
 */
export function DrillHeader({
  crumbs,
  onJump,
  onBack,
  backLabel = "Back",
  ariaLabel,
  className,
}: DrillHeaderProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        onBack();
        return;
      }
      // Don't hijack Esc while a real modal is open — it owns Esc. (Desktop
      // windows use role="dialog" too, so guard on aria-modal, not role.)
      if (e.key === "Escape" && !document.querySelector('[aria-modal="true"]')) {
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        title={`${backLabel} · Esc`}
        className="press inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-50"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {backLabel}
      </button>
      <DrillBreadcrumb crumbs={crumbs} onJump={onJump} ariaLabel={ariaLabel} />
    </div>
  );
}
