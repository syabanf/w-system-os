"use client";

import { create } from "zustand";

/** Tiny store used to pass a category filter from the Client Portal mega-menu
 *  into the Integration Dashboard. Persists only in memory — refreshing the
 *  app starts with no filter. */
interface IntegrationFilterState {
  category: string | null;
  setCategory: (id: string | null) => void;
  clear: () => void;
}

export const useIntegrationFilterStore = create<IntegrationFilterState>((set) => ({
  category: null,
  setCategory: (id) => set({ category: id }),
  clear: () => set({ category: null }),
}));
