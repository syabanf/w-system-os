"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  Moon,
  Search,
  Settings2,
  Sun,
  User,
  Wifi,
  BatteryFull,
  CloudSun,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useDesktopStore } from "@/state/desktop.store";
import { useSpotlightStore } from "@/state/spotlight.store";
import { useNotificationStore } from "@/state/notification.store";
import { useThemeStore } from "@/state/theme.store";
import { useToast } from "@/state/toast.store";
import { useWindowStore } from "@/state/window.store";
import { useReddieStore } from "@/state/reddie.store";
import { useShortcutsStore } from "@/state/shortcuts.store";
import { useIntegrationFilterStore } from "@/state/integrationFilter.store";
import { APP_MODULES } from "@/constants/appModules";
import { WitLogoMark } from "@/presentation/shared/WitLogoMark";
import { ClientPortalMegaMenu } from "@/presentation/desktop/ClientPortalMegaMenu";
import { MenuBarMenu, type MenuBarItem } from "@/presentation/desktop/MenuBarMenu";

const MODULE_NAME = new Map(APP_MODULES.map((m) => [m.id, m.shortName ?? m.name]));

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function execEdit(cmd: "cut" | "copy" | "paste" | "selectAll") {
  try {
    document.execCommand(cmd);
  } catch {
    // execCommand is best-effort; ignore when unsupported / no editable focus.
  }
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TopMenuBar() {
  const toggleNotifications = useDesktopStore((s) => s.toggleNotifications);
  const toggleSettings = useDesktopStore((s) => s.toggleSettings);
  const toggleProfile = useDesktopStore((s) => s.toggleProfile);
  const toggleLauncher = useDesktopStore((s) => s.toggleLauncher);
  const isLauncherOpen = useDesktopStore((s) => s.isLauncherOpen);
  const openSpotlight = useSpotlightStore((s) => s.open);
  const unread = useNotificationStore((s) => s.unread);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const toast = useToast();
  const openApp = useWindowStore((s) => s.openApp);
  const closeApp = useWindowStore((s) => s.closeApp);
  const focusApp = useWindowStore((s) => s.focusApp);
  const openOrder = useWindowStore((s) => s.order);
  const focused = useWindowStore((s) => s.focused);
  const openReddie = useReddieStore((s) => s.open);
  const openShortcuts = useShortcutsStore((s) => s.open);
  const setIntegrationCategory = useIntegrationFilterStore((s) => s.setCategory);
  const now = useClock();
  const [isClientPortalOpen, setClientPortalOpen] = useState(false);
  const clientPortalTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="glass-strong fixed inset-x-0 top-0 z-40 flex h-9 items-center justify-between border-b border-white/8 px-3 text-xs text-zinc-300">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLauncher}
          aria-label="Open app launcher"
          title="Apps"
          className={cn(
            "group flex items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors",
            isLauncherOpen ? "bg-white/10" : "hover:bg-white/8",
          )}
        >
          <WitLogoMark size={20} />
          <span className="font-semibold text-zinc-50">WIT ERP OS</span>
        </button>
        <nav className="hidden items-center gap-3 text-zinc-400 md:flex">
          <button
            onClick={toggleLauncher}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors",
              isLauncherOpen ? "bg-white/10 text-zinc-100" : "hover:text-zinc-100",
            )}
            title="Show all apps"
          >
            <LayoutGrid className="h-3 w-3" />
            Apps
          </button>
          <MenuBarMenu
            label="File"
            items={() => [
              { label: "Open app…", shortcut: "⌘O", onClick: toggleLauncher },
              { label: "Spotlight search", shortcut: "⌘K", onClick: openSpotlight },
              { separator: true },
              {
                label: "Close window",
                shortcut: "⌘W",
                disabled: !focused,
                onClick: () => focused && closeApp(focused),
              },
              {
                label: "Close all windows",
                disabled: openOrder.length === 0,
                onClick: () => [...openOrder].forEach((id) => closeApp(id)),
              },
            ]}
          />
          <MenuBarMenu
            label="Edit"
            items={() => [
              { label: "Cut", shortcut: "⌘X", onClick: () => execEdit("cut") },
              { label: "Copy", shortcut: "⌘C", onClick: () => execEdit("copy") },
              { label: "Paste", shortcut: "⌘V", onClick: () => execEdit("paste") },
              { separator: true },
              { label: "Select all", shortcut: "⌘A", onClick: () => execEdit("selectAll") },
            ]}
          />
          <MenuBarMenu
            label="View"
            items={() => [
              {
                label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
                onClick: toggleTheme,
              },
              { label: "Show all apps", onClick: toggleLauncher },
              { label: "Notifications", onClick: toggleNotifications },
              { label: "Reddie assistant", onClick: openReddie },
              { separator: true },
              { label: "Toggle full screen", shortcut: "⌃⌘F", onClick: toggleFullscreen },
            ]}
          />
          <MenuBarMenu
            label="Workspaces"
            items={() => {
              const windows: MenuBarItem[] =
                openOrder.length === 0
                  ? [{ label: "No open windows", disabled: true }]
                  : openOrder.map((id) => ({
                      label: MODULE_NAME.get(id) ?? id,
                      onClick: () => focusApp(id),
                    }));
              return [
                ...windows,
                { separator: true },
                {
                  label: "Close all windows",
                  disabled: openOrder.length === 0,
                  onClick: () => [...openOrder].forEach((id) => closeApp(id)),
                },
              ];
            }}
          />
          <MenuBarMenu
            label="Help"
            items={() => [
              { label: "Keyboard shortcuts", shortcut: "?", onClick: openShortcuts },
              { label: "Ask Reddie", onClick: openReddie },
              { separator: true },
              {
                label: "About WIT ERP OS",
                onClick: () =>
                  toast.info("WIT ERP OS", "Demo build — a macOS-style ERP workspace shell."),
              },
            ]}
          />
          <div className="relative">
            <button
              ref={clientPortalTriggerRef}
              onClick={() => setClientPortalOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isClientPortalOpen}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors",
                isClientPortalOpen ? "bg-white/10 text-zinc-100" : "hover:text-zinc-100",
              )}
            >
              Client Portal
              <ChevronDown className="h-3 w-3" />
            </button>
            <ClientPortalMegaMenu
              open={isClientPortalOpen}
              onClose={() => setClientPortalOpen(false)}
              onSelect={(id) => {
                setIntegrationCategory(id);
                openApp("integration");
                toast.info(
                  "Opening Integration Dashboard",
                  `Filtered by ${id.replace("-", " ")}`,
                );
              }}
              anchorRef={clientPortalTriggerRef}
            />
          </div>
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={openSpotlight}
          className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-white/25 hover:text-zinc-100"
        >
          <Search className="h-3 w-3 text-zinc-400" />
          <span className="hidden md:inline">Search anywhere</span>
          <kbd className="hidden rounded bg-white/8 px-1.5 text-[9px] text-zinc-400 md:inline">⌘K</kbd>
        </button>
        <IconButton
          onClick={toggleTheme}
          ariaLabel={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </IconButton>
        <IconButton onClick={toggleNotifications} ariaLabel="Notifications" badge={unread}>
          <Bell className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton onClick={toggleSettings} ariaLabel="Quick settings">
          <Settings2 className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton onClick={toggleProfile} ariaLabel="Profile">
          <User className="h-3.5 w-3.5" />
        </IconButton>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Wifi className="h-3.5 w-3.5" />
          <BatteryFull className="h-3.5 w-3.5" />
          <CloudSun className="h-3.5 w-3.5" />
        </div>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <span className="font-mono tabular-nums text-zinc-200">
          {now
            ? now.toLocaleString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "—"}
        </span>
      </div>
    </div>
  );
}

interface IconButtonProps {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  badge?: number;
}

function IconButton({ children, ariaLabel, onClick, badge }: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "relative grid h-7 w-7 place-items-center rounded-lg text-zinc-300 transition-colors",
        "hover:bg-white/8 hover:text-zinc-50",
      )}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-zinc-50 px-1 text-[8px] font-bold text-zinc-900 shadow-md ring-1 ring-black/30">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}
