"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/state/window.store";
import { DesktopBackground } from "@/presentation/desktop/DesktopBackground";
import { MasterDataDrawer } from "@/presentation/shared/MasterDataDrawer";
import { MobileStatusBar } from "./MobileStatusBar";
import { MobileHomeScreen } from "./MobileHomeScreen";
import { MobileAppCanvas } from "./MobileAppCanvas";

export function MobileShell() {
  const focused = useWindowStore((s) => s.focused);
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);

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
        <MobileStatusBar />
        <div className="flex-1 overflow-hidden">
          <MobileHomeScreen />
        </div>
      </div>
      <AnimatePresence>
        {active ? <MobileAppCanvas key={active} id={active} /> : null}
      </AnimatePresence>
      <MasterDataDrawer />
    </main>
  );
}
