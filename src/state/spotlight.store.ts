"use client";

import { create } from "zustand";

interface SpotlightState {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
}

export const useSpotlightStore = create<SpotlightState>((set, get) => ({
  isOpen: false,
  query: "",
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: "" }),
  toggle: () => set({ isOpen: !get().isOpen, query: get().isOpen ? "" : get().query }),
  setQuery: (query) => set({ query }),
}));
