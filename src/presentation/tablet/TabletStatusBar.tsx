"use client";

import { useEffect, useState } from "react";
import { Signal, Wifi, BatteryFull, Bell, Settings2 } from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import { useNotificationStore } from "@/state/notification.store";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TabletStatusBar() {
  const toggleNotifications = useDesktopStore((s) => s.toggleNotifications);
  const toggleSettings = useDesktopStore((s) => s.toggleSettings);
  const unread = useNotificationStore((s) => s.unread);
  const now = useClock();

  return (
    <div className="pointer-events-auto flex h-9 items-center justify-between px-5 text-xs font-medium text-zinc-100">
      <span className="font-semibold">
        {now ? now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" }) : "—"}
      </span>
      <span className="font-mono tabular-nums font-semibold">
        {now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
      </span>
      <span className="flex items-center gap-2">
        <button onClick={toggleNotifications} aria-label="Notifications" className="relative grid h-7 w-7 place-items-center rounded-full hover:bg-white/10">
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-zinc-50 px-1 text-[8px] font-bold text-zinc-900 ring-1 ring-black/30">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
        <button onClick={toggleSettings} aria-label="Settings" className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10">
          <Settings2 className="h-3.5 w-3.5" />
        </button>
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </span>
    </div>
  );
}
