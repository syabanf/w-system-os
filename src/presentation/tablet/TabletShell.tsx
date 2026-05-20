"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/state/window.store";
import { useControlCenterStore } from "@/state/controlCenter.store";
import { useEdgeSwipe } from "@/hooks/useEdgeSwipe";
import { DesktopBackground } from "@/presentation/desktop/DesktopBackground";
import { NotificationCenter } from "@/presentation/desktop/NotificationCenter";
import { QuickSettingsPanel } from "@/presentation/desktop/QuickSettingsPanel";
import { SpotlightSearch } from "@/presentation/desktop/SpotlightSearch";
import { MasterDataDrawer } from "@/presentation/shared/MasterDataDrawer";
import { ControlCenter } from "@/presentation/shared/ControlCenter";
import { TabletStatusBar } from "./TabletStatusBar";
import { TabletHomeScreen } from "./TabletHomeScreen";
import { TabletAppCanvas } from "./TabletAppCanvas";

export function TabletShell() {
  const focused = useWindowStore((s) => s.focused);
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const openControlCenter = useControlCenterStore((s) => s.open);

  useEdgeSwipe(true);

  const active = focused && windows[focused]
    ? focused
    : order.length > 0
      ? order[order.length - 1]
      : null;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <DesktopBackground />
      {/* Top-right hot zone — tap-to-open Control Center as a swipe fallback. */}
      <button
        type="button"
        aria-label="Open Control Center"
        onClick={openControlCenter}
        className="absolute right-0 top-0 z-20 h-11 w-1/3"
      />
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
      <ControlCenter />
    </main>
  );
}
