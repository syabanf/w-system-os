"use client";

import { create } from "zustand";

export interface ControlCenterToggles {
  wifi: boolean;
  bluetooth: boolean;
  airdrop: boolean;
  focusMode: boolean;
  mute: boolean;
  orientationLock: boolean;
  musicPlaying: boolean;
  brightness: number;
  volume: number;
}

/** Boolean-valued toggle keys (everything except the numeric sliders). */
export type BooleanToggleKey = {
  [K in keyof ControlCenterToggles]: ControlCenterToggles[K] extends boolean ? K : never;
}[keyof ControlCenterToggles];

const DEFAULT_TOGGLES: ControlCenterToggles = {
  wifi: true,
  bluetooth: true,
  airdrop: true,
  focusMode: false,
  mute: false,
  orientationLock: false,
  musicPlaying: false,
  brightness: 72,
  volume: 48,
};

const STORAGE_KEY = "wit-erp-os.controlCenter";

function loadToggles(): ControlCenterToggles {
  if (typeof window === "undefined") return DEFAULT_TOGGLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOGGLES;
    return { ...DEFAULT_TOGGLES, ...(JSON.parse(raw) as Partial<ControlCenterToggles>) };
  } catch {
    return DEFAULT_TOGGLES;
  }
}

function persist(toggles: ControlCenterToggles) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
  } catch {
    // storage disabled / quota — ignore; in-memory state still works.
  }
}

interface ControlCenterState {
  isOpen: boolean;
  /** Live drag offset (0..1) while the user is pulling the sheet down from
   *  the top edge. UI uses this for the rubber-band reveal animation. */
  dragProgress: number;
  /** Persisted quick-toggle state (Wi-Fi, brightness, …). */
  toggles: ControlCenterToggles;
  isHydrated: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setDragProgress: (v: number) => void;
  /** Load persisted toggles on the client (avoids an SSR hydration mismatch). */
  hydrate: () => void;
  setToggle: <K extends keyof ControlCenterToggles>(key: K, value: ControlCenterToggles[K]) => void;
  flip: (key: BooleanToggleKey) => void;
  resetToggles: () => void;
}

export const useControlCenterStore = create<ControlCenterState>((set, get) => ({
  isOpen: false,
  dragProgress: 0,
  toggles: DEFAULT_TOGGLES,
  isHydrated: false,
  open: () => set({ isOpen: true, dragProgress: 1 }),
  close: () => set({ isOpen: false, dragProgress: 0 }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen, dragProgress: s.isOpen ? 0 : 1 })),
  setDragProgress: (v) => set({ dragProgress: Math.max(0, Math.min(1, v)) }),
  hydrate: () => {
    if (get().isHydrated) return;
    set({ toggles: loadToggles(), isHydrated: true });
  },
  setToggle: (key, value) => {
    const next = { ...get().toggles, [key]: value };
    persist(next);
    set({ toggles: next });
  },
  flip: (key) => {
    const next = { ...get().toggles, [key]: !get().toggles[key] };
    persist(next);
    set({ toggles: next });
  },
  resetToggles: () => {
    persist(DEFAULT_TOGGLES);
    set({ toggles: DEFAULT_TOGGLES });
  },
}));
