"use client";

import { create } from "zustand";

interface ShortcutsState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** Open state for the keyboard-shortcuts overlay. Driven by the `?` hotkey and
 *  the Help menu so both stay in sync. */
export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
