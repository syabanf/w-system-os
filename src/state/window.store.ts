"use client";

import { create } from "zustand";
import type { AppModuleId } from "@/constants/appModules";

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopWindow {
  id: AppModuleId;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  openedAt: number;
  /** Persisted bounds for the un-maximized state. Undefined until the user
   *  drags/resizes — components compute a default centered layout in that case. */
  bounds?: WindowBounds;
}

interface WindowState {
  windows: Record<AppModuleId, DesktopWindow>;
  order: AppModuleId[];
  focused: AppModuleId | null;
  nextZ: number;
  openApp: (id: AppModuleId) => void;
  closeApp: (id: AppModuleId) => void;
  focusApp: (id: AppModuleId) => void;
  toggleMinimize: (id: AppModuleId) => void;
  toggleMaximize: (id: AppModuleId) => void;
  restore: (id: AppModuleId) => void;
  setBounds: (id: AppModuleId, bounds: WindowBounds) => void;
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: {} as Record<AppModuleId, DesktopWindow>,
  order: [],
  focused: null,
  nextZ: 10,

  openApp: (id) => {
    const state = get();
    if (state.windows[id]) {
      set({
        windows: {
          ...state.windows,
          [id]: {
            ...state.windows[id],
            isMinimized: false,
            zIndex: state.nextZ,
          },
        },
        nextZ: state.nextZ + 1,
        focused: id,
      });
      return;
    }
    set({
      windows: {
        ...state.windows,
        [id]: {
          id,
          isMinimized: false,
          isMaximized: false,
          zIndex: state.nextZ,
          openedAt: Date.now(),
        },
      },
      order: [...state.order, id],
      focused: id,
      nextZ: state.nextZ + 1,
    });
  },

  closeApp: (id) => {
    const state = get();
    const next = { ...state.windows };
    delete next[id];
    const order = state.order.filter((x) => x !== id);
    set({
      windows: next,
      order,
      focused: order[order.length - 1] ?? null,
    });
  },

  focusApp: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...win, zIndex: state.nextZ, isMinimized: false },
      },
      nextZ: state.nextZ + 1,
      focused: id,
    });
  },

  toggleMinimize: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    const isMinimized = !win.isMinimized;
    set({
      windows: { ...state.windows, [id]: { ...win, isMinimized } },
      focused: isMinimized
        ? state.order.filter((x) => x !== id && !state.windows[x].isMinimized).slice(-1)[0] ?? null
        : id,
    });
  },

  toggleMaximize: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...win, isMaximized: !win.isMaximized, zIndex: state.nextZ },
      },
      nextZ: state.nextZ + 1,
      focused: id,
    });
  },

  restore: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...win, isMinimized: false, zIndex: state.nextZ },
      },
      nextZ: state.nextZ + 1,
      focused: id,
    });
  },

  setBounds: (id, bounds) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: { ...state.windows, [id]: { ...win, bounds } },
    });
  },
}));
