"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/state/window.store";
import { useControlCenterStore } from "@/state/controlCenter.store";
import { useEdgeSwipe } from "@/hooks/useEdgeSwipe";
import { DesktopBackground } from "@/presentation/desktop/DesktopBackground";
import { MasterDataDrawer } from "@/presentation/shared/MasterDataDrawer";
import { ControlCenter } from "@/presentation/shared/ControlCenter";
import { ProfileDialog } from "@/presentation/shared/ProfileDialog";
import { MobileStatusBar } from "./MobileStatusBar";
import { MobileHomeScreen } from "./MobileHomeScreen";
import { MobileAppCanvas } from "./MobileAppCanvas";

export function MobileShell() {
  const focused = useWindowStore((s) => s.focused);
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const openControlCenter = useControlCenterStore((s) => s.open);

  // Listen for "swipe down from top-right" anywhere in the shell.
  useEdgeSwipe(true);

  // The active fullscreen app is the most recently focused open window.
  const active = focused && windows[focused]
    ? focused
    : order.length > 0
      ? order[order.length - 1]
      : null;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <DesktopBackground />
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Top-right of the status bar is also tappable as a discoverability
            fallback — matches iOS where you can tap the battery icon. */}
        <button
          type="button"
          aria-label="Open Control Center"
          onClick={openControlCenter}
          className="absolute right-0 top-0 z-20 h-11 w-1/2"
        />
        <MobileStatusBar />
        <div className="flex-1 overflow-hidden">
          <MobileHomeScreen />
        </div>
      </div>
      <AnimatePresence>
        {active ? <MobileAppCanvas key={active} id={active} /> : null}
      </AnimatePresence>
      <MasterDataDrawer />
      <ControlCenter />
      <ProfileDialog />
    </main>
  );
}
