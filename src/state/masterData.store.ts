"use client";

import { create } from "zustand";
import type { AppModuleId } from "@/constants/appModules";
import type { MDCategoryDef, MDItem } from "@/domain/entities/MasterData";
import {
  MASTER_DATA_CATEGORIES,
  MASTER_DATA_SEEDS,
} from "@/infrastructure/data/masterDataSeeds";

const STORAGE_KEY = "wit-erp-os.masterData";

function loadFromStorage(): Record<string, MDItem[]> {
  if (typeof window === "undefined") return MASTER_DATA_SEEDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return MASTER_DATA_SEEDS;
    const parsed = JSON.parse(raw) as Record<string, MDItem[]>;
    // Backfill any categories that exist in seeds but not in storage (new ones added later).
    const merged = { ...MASTER_DATA_SEEDS, ...parsed };
    return merged;
  } catch {
    return MASTER_DATA_SEEDS;
  }
}

function persist(items: Record<string, MDItem[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage failures
  }
}

interface MasterDataState {
  isDrawerOpen: boolean;
  activeModuleId: AppModuleId | null;
  activeCategoryId: string | null;
  itemsByCategory: Record<string, MDItem[]>;

  openDrawer: (moduleId: AppModuleId) => void;
  closeDrawer: () => void;
  setActiveCategory: (categoryId: string) => void;

  categoriesForModule: (moduleId: AppModuleId) => MDCategoryDef[];

  addItem: (categoryId: string, item: Omit<MDItem, "id">) => void;
  updateItem: (categoryId: string, id: string, patch: Partial<MDItem>) => void;
  deleteItem: (categoryId: string, id: string) => void;
  resetCategory: (categoryId: string) => void;
}

function genId(): string {
  return `md-${Math.random().toString(36).slice(2, 9)}`;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  isDrawerOpen: false,
  activeModuleId: null,
  activeCategoryId: null,
  itemsByCategory: typeof window === "undefined" ? MASTER_DATA_SEEDS : loadFromStorage(),

  openDrawer: (moduleId) => {
    const first = MASTER_DATA_CATEGORIES.find((c) => c.module === moduleId);
    set({
      isDrawerOpen: true,
      activeModuleId: moduleId,
      activeCategoryId: first?.id ?? null,
    });
  },
  closeDrawer: () => set({ isDrawerOpen: false }),
  setActiveCategory: (categoryId) => set({ activeCategoryId: categoryId }),

  categoriesForModule: (moduleId) =>
    MASTER_DATA_CATEGORIES.filter((c) => c.module === moduleId),

  addItem: (categoryId, item) => {
    const items = get().itemsByCategory;
    const next = {
      ...items,
      [categoryId]: [...(items[categoryId] ?? []), { id: genId(), ...item } as MDItem],
    };
    persist(next);
    set({ itemsByCategory: next });
  },
  updateItem: (categoryId, id, patch) => {
    const items = get().itemsByCategory;
    const list = items[categoryId] ?? [];
    const next = {
      ...items,
      [categoryId]: list.map((it) => (it.id === id ? { ...it, ...patch, id } : it)),
    };
    persist(next);
    set({ itemsByCategory: next });
  },
  deleteItem: (categoryId, id) => {
    const items = get().itemsByCategory;
    const next = {
      ...items,
      [categoryId]: (items[categoryId] ?? []).filter((it) => it.id !== id),
    };
    persist(next);
    set({ itemsByCategory: next });
  },
  resetCategory: (categoryId) => {
    const items = get().itemsByCategory;
    const next = {
      ...items,
      [categoryId]: MASTER_DATA_SEEDS[categoryId] ?? [],
    };
    persist(next);
    set({ itemsByCategory: next });
  },
}));

export { MASTER_DATA_CATEGORIES };
