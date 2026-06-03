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
  /** True once we've attempted to load the saved layout from localStorage. */
  isHydrated: boolean;
  hydrate: () => void;
  openApp: (id: AppModuleId) => void;
  closeApp: (id: AppModuleId) => void;
  focusApp: (id: AppModuleId) => void;
  toggleMinimize: (id: AppModuleId) => void;
  toggleMaximize: (id: AppModuleId) => void;
  restore: (id: AppModuleId) => void;
  setBounds: (id: AppModuleId, bounds: WindowBounds) => void;
  snapLeft: (id: AppModuleId) => void;
  snapRight: (id: AppModuleId) => void;
}

const STORAGE_KEY = "wit-erp-os.windows";

/** Subset of state we persist across reloads. */
type PersistedWindowState = Pick<
  WindowState,
  "windows" | "order" | "focused" | "nextZ"
>;

/** Workspace insets, mirrored from AppWindow so snapped windows align with
 *  the same clamping the drag/resize logic applies. */
const TOP_INSET = 56;
const BOTTOM_INSET = 116;
const SIDE_INSET = 12;
/** Gap between the two snapped halves. */
const GUTTER = 12;

function persistState(state: PersistedWindowState) {
  if (typeof window === "undefined") return;
  try {
    const { windows, order, focused, nextZ } = state;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ windows, order, focused, nextZ }),
    );
  } catch {
    // Quota exceeded or storage disabled — the in-memory store still works.
  }
}

function loadState(): PersistedWindowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWindowState>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.windows || !Array.isArray(parsed.order)) return null;
    return {
      windows: parsed.windows as Record<AppModuleId, DesktopWindow>,
      order: parsed.order as AppModuleId[],
      focused: (parsed.focused ?? null) as AppModuleId | null,
      nextZ: typeof parsed.nextZ === "number" ? parsed.nextZ : 10,
    };
  } catch {
    return null;
  }
}

export const useWindowStore = create<WindowState>((set, get) => {
  /** Serialize the current layout after a mutating action. */
  const persist = () => {
    const { windows, order, focused, nextZ } = get();
    persistState({ windows, order, focused, nextZ });
  };

  return {
  windows: {} as Record<AppModuleId, DesktopWindow>,
  order: [],
  focused: null,
  nextZ: 10,
  isHydrated: false,

  hydrate: () => {
    if (get().isHydrated) return;
    const stored = loadState();
    if (stored) {
      set({ ...stored, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },

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
      persist();
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
    persist();
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
    persist();
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
    persist();
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
    persist();
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
    persist();
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
    persist();
  },

  setBounds: (id, bounds) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: { ...state.windows, [id]: { ...win, bounds } },
    });
    persist();
  },

  snapLeft: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          isMaximized: false,
          bounds: halfBounds("left"),
          zIndex: state.nextZ,
        },
      },
      nextZ: state.nextZ + 1,
      focused: id,
    });
    persist();
  },

  snapRight: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [id]: {
          ...win,
          isMaximized: false,
          bounds: halfBounds("right"),
          zIndex: state.nextZ,
        },
      },
      nextZ: state.nextZ + 1,
      focused: id,
    });
    persist();
  },
  };
});

/** Compute bounds filling the left or right half of the workspace, leaving
 *  room for the top menu bar and bottom dock. Guards SSR. */
function halfBounds(side: "left" | "right"): WindowBounds {
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const width = Math.round(vw / 2 - SIDE_INSET - GUTTER / 2);
  const height = vh - TOP_INSET - BOTTOM_INSET;
  const x = side === "left" ? SIDE_INSET : Math.round(vw / 2 + GUTTER / 2);
  return { x, y: TOP_INSET, width, height };
}
