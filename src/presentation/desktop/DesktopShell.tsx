"use client";

import { useState } from "react";
import { DesktopBackground } from "./DesktopBackground";
import { TopMenuBar } from "./TopMenuBar";
import { AppDock } from "./AppDock";
import { WindowManager } from "./WindowManager";
import { SpotlightSearch } from "./SpotlightSearch";
import { ShortcutsOverlay } from "./ShortcutsOverlay";
import { NotificationCenter } from "./NotificationCenter";
import { QuickSettingsPanel } from "./QuickSettingsPanel";
import { UserProfileMenu } from "./UserProfileMenu";
import { DesktopLauncher } from "./DesktopLauncher";
import { MasterDataDrawer } from "@/presentation/shared/MasterDataDrawer";
import { useWindowStore } from "@/state/window.store";
import { DesktopWelcome } from "./DesktopWelcome";
import { ProfileDialog } from "@/presentation/shared/ProfileDialog";
import { DesktopContextMenu, type ContextMenuAnchor } from "./DesktopContextMenu";

export function DesktopShell() {
  const hasAnyWindow = useWindowStore((s) => s.order.length > 0);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuAnchor | null>(null);

  // Right-clicking the empty desktop opens the context menu; windows, dialogs,
  // and other popovers keep their own (or the browser's) behavior.
  const handleContextMenu = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest("[data-window], [role='dialog'], [role='menu']")) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <main
      onContextMenu={handleContextMenu}
      className="relative h-screen w-screen overflow-hidden"
    >
      <DesktopBackground />
      <TopMenuBar />
      {!hasAnyWindow ? <DesktopWelcome /> : null}
      <WindowManager />
      <NotificationCenter />
      <QuickSettingsPanel />
      <UserProfileMenu />
      <AppDock />
      <SpotlightSearch />
      <ShortcutsOverlay />
      <DesktopLauncher />
      <MasterDataDrawer />
      <ProfileDialog />
      <DesktopContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
    </main>
  );
}
