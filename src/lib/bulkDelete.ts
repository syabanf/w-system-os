import type { ToastTone } from "@/state/toast.store";

interface ToastLike {
  push: (t: {
    tone: ToastTone;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  }) => string;
}

/**
 * Delete a set of records by id and surface an undoable toast. The removed
 * records are captured up-front so "Undo" can re-insert them (with their
 * original ids) via the store's `restore`. Mirrors the single-delete undo
 * already used across the CRUD views.
 */
export function bulkDeleteWithUndo<T extends { id: string }>(params: {
  ids: Iterable<string>;
  /** The raw store records (used to capture what's being deleted). */
  items: T[];
  remove: (id: string) => void;
  restore: (records: T[]) => void;
  toast: ToastLike;
  /** Singular noun, e.g. "lead" → "3 leads deleted". */
  noun: string;
  /** Run after deletion, e.g. clear the selection. */
  onDone?: () => void;
}): void {
  const idSet = new Set(params.ids);
  const removed = params.items.filter((r) => idSet.has(r.id));
  if (removed.length === 0) return;
  removed.forEach((r) => params.remove(r.id));
  params.onDone?.();
  params.toast.push({
    tone: "info",
    title: `${removed.length} ${params.noun}${removed.length === 1 ? "" : "s"} deleted`,
    action: { label: "Undo", onClick: () => params.restore(removed) },
  });
}
