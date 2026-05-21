"use client";

import { Inbox, Plus, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Optional icon override; defaults to Inbox. */
  icon?: LucideIcon;
  /** Short scannable headline e.g. "No clients yet". */
  title: string;
  /** One-sentence helper text. */
  description?: string;
  /** When both are set, renders a primary CTA so first-time users have a
   *  one-tap path to start populating the list. */
  actionLabel?: string;
  onAction?: () => void;
}

/** Reusable empty-state placeholder used inside CRUD list panels. Renders a
 *  centred icon + headline + optional CTA — replaces the bare "No rows"
 *  fallback so first-time users see a clear next step. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-zinc-300">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-zinc-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-zinc-400">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
        >
          <Plus className="h-3 w-3" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
