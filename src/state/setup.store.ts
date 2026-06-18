"use client";

import { create } from "zustand";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";

const STORAGE_KEY = "wit-erp-os.setup";

/** The dashboard is the shell's landing surface (DEFAULT_OPEN_MODULE), so it
 *  can't be switched off — the wizard renders it locked-on. */
export const REQUIRED_MODULES: readonly AppModuleId[] = ["dashboard"];

/** Curated core enabled by the wizard's "Recommended" preset. */
export const RECOMMENDED_MODULES: readonly AppModuleId[] = [
  "dashboard",
  "leads",
  "clients",
  "projects",
  "support",
  "hr",
  "timesheet",
  "finance",
  "transaction",
  "knowledge",
];

const ALL_IDS: AppModuleId[] = APP_MODULES.map((m) => m.id);
const KNOWN = new Set<AppModuleId>(ALL_IDS);

interface Persisted {
  /** Has the first-run wizard been finished at least once? */
  isComplete: boolean;
  /** Module ids the user chose to surface in the shell. */
  enabled: AppModuleId[];
}

const DEFAULTS: Persisted = { isComplete: false, enabled: ALL_IDS };

/** Re-order to the registry's canonical order, drop unknown ids, and force the
 *  required modules on — so persisted data, presets, and user toggles all
 *  normalise to the same stable shape. */
export function normalizeEnabled(ids: Iterable<AppModuleId>): AppModuleId[] {
  const set = new Set<AppModuleId>();
  for (const id of ids) if (KNOWN.has(id)) set.add(id);
  for (const id of REQUIRED_MODULES) set.add(id);
  return ALL_IDS.filter((id) => set.has(id));
}

function load(): Persisted {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      isComplete: parsed.isComplete === true,
      enabled: Array.isArray(parsed.enabled)
        ? normalizeEnabled(parsed.enabled as AppModuleId[])
        : ALL_IDS,
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(s: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage disabled / quota — ignore; in-memory state still works.
  }
}

interface SetupState {
  isComplete: boolean;
  enabled: AppModuleId[];
  isHydrated: boolean;
  /** Load persisted state on the client (avoids an SSR hydration mismatch). */
  hydrate: () => void;
  /** Persist the chosen module set and mark first-run setup done. */
  complete: (enabled: AppModuleId[]) => void;
  /** Re-open the wizard, keeping the current selection as the starting point. */
  reopen: () => void;
  /** Factory reset: every module on, wizard shows again on next load. */
  reset: () => void;
}

export const useSetupStore = create<SetupState>((set, get) => ({
  isComplete: false,
  enabled: ALL_IDS,
  isHydrated: false,
  hydrate: () => {
    if (get().isHydrated) return;
    set({ ...load(), isHydrated: true });
  },
  complete: (enabled) => {
    const next: Persisted = { isComplete: true, enabled: normalizeEnabled(enabled) };
    persist(next);
    set(next);
  },
  reopen: () => {
    persist({ isComplete: false, enabled: get().enabled });
    set({ isComplete: false });
  },
  reset: () => {
    persist(DEFAULTS);
    set({ ...DEFAULTS });
  },
}));

/** Registry filtered to the modules enabled during setup — what the dock,
 *  launcher, and other app surfaces should actually show. */
export function useEnabledModules(): AppModule[] {
  const enabled = useSetupStore((s) => s.enabled);
  const allow = new Set(enabled);
  return APP_MODULES.filter((m) => allow.has(m.id));
}

/** Non-reactive membership check for event handlers / command surfaces. */
export function isModuleEnabled(id: AppModuleId): boolean {
  return useSetupStore.getState().enabled.includes(id);
}
