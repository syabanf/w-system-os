"use client";

import { DesktopBackground } from "./DesktopBackground";
import { TopMenuBar } from "./TopMenuBar";
import { AppDock } from "./AppDock";
import { WindowManager } from "./WindowManager";
import { SpotlightSearch } from "./SpotlightSearch";
import { NotificationCenter } from "./NotificationCenter";
import { QuickSettingsPanel } from "./QuickSettingsPanel";
import { UserProfileMenu } from "./UserProfileMenu";
import { DesktopLauncher } from "./DesktopLauncher";
import { MasterDataDrawer } from "@/presentation/shared/MasterDataDrawer";
import { useWindowStore } from "@/state/window.store";
import { DesktopWelcome } from "./DesktopWelcome";

export function DesktopShell() {
  const hasAnyWindow = useWindowStore((s) => s.order.length > 0);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <DesktopBackground />
      <TopMenuBar />
      {!hasAnyWindow ? <DesktopWelcome /> : null}
      <WindowManager />
      <NotificationCenter />
      <QuickSettingsPanel />
      <UserProfileMenu />
      <AppDock />
      <SpotlightSearch />
      <DesktopLauncher />
      <MasterDataDrawer />
    </main>
  );
}
