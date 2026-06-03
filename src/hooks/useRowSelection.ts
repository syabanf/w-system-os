"use client";

import { useCallback, useState } from "react";

/**
 * Row-selection state for bulk actions on a table. Tracks a Set of selected
 * row ids and offers toggle / select-all / clear helpers. The caller passes the
 * currently-visible ids to `toggleAll` / `allSelected` so "select all" respects
 * filtering.
 */
export function useRowSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      return allOn ? new Set() : new Set(ids);
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const allSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  const someSelected = useCallback(
    (ids: string[]) => ids.some((id) => selectedIds.has(id)) && !ids.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  return {
    selectedIds,
    count: selectedIds.size,
    toggle,
    toggleAll,
    clear,
    isSelected,
    allSelected,
    someSelected,
  };
}
