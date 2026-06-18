"use client";

import { create } from "zustand";
import {
  DEFAULT_WALLPAPER_ID,
  WALLPAPERS,
  type Wallpaper,
} from "@/constants/wallpapers";

const STORAGE_KEY = "wit-erp-os.wallpaper";

function load(): string {
  if (typeof window === "undefined") return DEFAULT_WALLPAPER_ID;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && WALLPAPERS.some((w) => w.id === raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_WALLPAPER_ID;
}

interface WallpaperState {
  id: string;
  isHydrated: boolean;
  /** Load the persisted choice on the client (avoids an SSR hydration mismatch). */
  hydrate: () => void;
  setWallpaper: (id: string) => void;
}

export const useWallpaperStore = create<WallpaperState>((set, get) => ({
  id: DEFAULT_WALLPAPER_ID,
  isHydrated: false,
  hydrate: () => {
    if (get().isHydrated) return;
    set({ id: load(), isHydrated: true });
  },
  setWallpaper: (id) => {
    if (!WALLPAPERS.some((w) => w.id === id)) return;
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

/** The selected wallpaper preset (falls back to the first if the id is stale). */
export function useCurrentWallpaper(): Wallpaper {
  const id = useWallpaperStore((s) => s.id);
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}
