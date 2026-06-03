"use client";

import { useCallback } from "react";
import { create } from "zustand";

/** Persisted per-key drill selection so a drill-down survives app switches and
 *  reloads (item: "persist drill state per window"). Keys are caller-chosen
 *  strings, typically the module id (e.g. "reports", "perf.template"). */
type DrillMap = Record<string, string | null>;

const STORAGE_KEY = "wit-erp-os.drill";

function load(): DrillMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DrillMap) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function save(map: DrillMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota/disabled — in-memory still works for the session.
  }
}

interface DrillStore {
  values: DrillMap;
  set: (key: string, value: string | null) => void;
}

export const useDrillStore = create<DrillStore>((set, get) => ({
  values: load(),
  set: (key, value) => {
    const next = { ...get().values, [key]: value };
    set({ values: next });
    save(next);
  },
}));

type Updater = string | null | ((prev: string | null) => string | null);

/**
 * Drop-in replacement for `useState<string | null>(null)` whose value is
 * persisted per `key`. Same call shape (`[value, setValue]`, supports an updater
 * fn), so callers can swap `useState` → `useDrillState("module")` with no other
 * change and keep their drill position across navigation/reloads.
 */
export function useDrillState(
  key: string,
  initial: string | null = null,
): [string | null, (v: Updater) => void] {
  const value = useDrillStore((s) => (key in s.values ? s.values[key] : initial));
  const setRaw = useDrillStore((s) => s.set);

  const setValue = useCallback(
    (v: Updater) => {
      const cur = useDrillStore.getState().values;
      const prev = key in cur ? cur[key] : initial;
      const nextVal =
        typeof v === "function"
          ? (v as (p: string | null) => string | null)(prev)
          : v;
      setRaw(key, nextVal);
    },
    [key, initial, setRaw],
  );

  return [value, setValue];
}
