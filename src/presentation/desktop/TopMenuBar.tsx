"use client";

import { useEffect, useState } from "react";
import {
  Bell,
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
import { WitLogoMark } from "@/presentation/shared/WitLogoMark";

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
  const now = useClock();

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
          <button className="hover:text-zinc-100">File</button>
          <button className="hover:text-zinc-100">Edit</button>
          <button className="hover:text-zinc-100">View</button>
          <button className="hover:text-zinc-100">Workspaces</button>
          <button className="hover:text-zinc-100">Help</button>
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
