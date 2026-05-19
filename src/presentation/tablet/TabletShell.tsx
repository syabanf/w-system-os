"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/state/window.store";
import { DesktopBackground } from "@/presentation/desktop/DesktopBackground";
import { NotificationCenter } from "@/presentation/desktop/NotificationCenter";
import { QuickSettingsPanel } from "@/presentation/desktop/QuickSettingsPanel";
import { SpotlightSearch } from "@/presentation/desktop/SpotlightSearch";
import { MasterDataDrawer } from "@/presentation/shared/MasterDataDrawer";
import { TabletStatusBar } from "./TabletStatusBar";
import { TabletHomeScreen } from "./TabletHomeScreen";
import { TabletAppCanvas } from "./TabletAppCanvas";

export function TabletShell() {
  const focused = useWindowStore((s) => s.focused);
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);

  const active = focused && windows[focused]
    ? focused
    : order.length > 0
      ? order[order.length - 1]
      : null;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <DesktopBackground />
      {!active ? (
        <div className="absolute inset-0 z-10 flex flex-col">
          <TabletStatusBar />
          <div className="flex-1 overflow-hidden">
            <TabletHomeScreen />
          </div>
        </div>
      ) : null}
      <AnimatePresence>
        {active ? <TabletAppCanvas key={active} id={active} /> : null}
      </AnimatePresence>
      <NotificationCenter />
      <QuickSettingsPanel />
      <SpotlightSearch />
      <MasterDataDrawer />
    </main>
  );
}
