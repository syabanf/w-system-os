"use client";

import { create } from "zustand";

interface ControlCenterState {
  isOpen: boolean;
  /** Live drag offset (0..1) while the user is pulling the sheet down from
   *  the top edge. UI uses this for the rubber-band reveal animation. */
  dragProgress: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setDragProgress: (v: number) => void;
}

export const useControlCenterStore = create<ControlCenterState>((set) => ({
  isOpen: false,
  dragProgress: 0,
  open: () => set({ isOpen: true, dragProgress: 1 }),
  close: () => set({ isOpen: false, dragProgress: 0 }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen, dragProgress: s.isOpen ? 0 : 1 })),
  setDragProgress: (v) => set({ dragProgress: Math.max(0, Math.min(1, v)) }),
}));
