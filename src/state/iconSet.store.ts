"use client";

import { create } from "zustand";
import type { LucideIcon } from "lucide-react";
import { type AppModule, type AppModuleId } from "@/constants/appModules";
import {
  DEFAULT_ICON_SET_ID,
  ICON_SETS,
  resolveModuleIcon,
} from "@/constants/iconSets";

const STORAGE_KEY = "wit-erp-os.iconSet";

function load(): string {
  if (typeof window === "undefined") return DEFAULT_ICON_SET_ID;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && ICON_SETS.some((s) => s.id === raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_ICON_SET_ID;
}

interface IconSetState {
  id: string;
  isHydrated: boolean;
  /** Load the persisted choice on the client (avoids an SSR hydration mismatch). */
  hydrate: () => void;
  setIconSet: (id: string) => void;
}

export const useIconSetStore = create<IconSetState>((set, get) => ({
  id: DEFAULT_ICON_SET_ID,
  isHydrated: false,
  hydrate: () => {
    if (get().isHydrated) return;
    set({ id: load(), isHydrated: true });
  },
  setIconSet: (id) => {
    if (!ICON_SETS.some((s) => s.id === id)) return;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore
      }
    }
    set({ id });
  },
}));

/** Returns a resolver for the current icon set — call it in render with a
 *  module (or id) to get the glyph component. Subscribes to set changes. */
export function useModuleIcon(): (m: AppModule | AppModuleId) => LucideIcon {
  const id = useIconSetStore((s) => s.id);
  return (m) => resolveModuleIcon(id, typeof m === "string" ? m : m.id);
}
