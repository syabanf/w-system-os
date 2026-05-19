"use client";

import { useShallow } from "zustand/react/shallow";
import { useWindowStore } from "@/state/window.store";

export function useDesktopWindows() {
  return useWindowStore(
    useShallow((s) => ({
      windows: s.windows,
      order: s.order,
      focused: s.focused,
      openApp: s.openApp,
      closeApp: s.closeApp,
      focusApp: s.focusApp,
      toggleMinimize: s.toggleMinimize,
      toggleMaximize: s.toggleMaximize,
      restore: s.restore,
    })),
  );
}
