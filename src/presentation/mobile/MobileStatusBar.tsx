"use client";

import { useEffect, useState } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function MobileStatusBar({ darkText = false }: { darkText?: boolean }) {
  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "—";

  return (
    <div
      className={`pointer-events-none flex h-11 items-center justify-between px-6 text-xs font-semibold ${
        darkText ? "text-zinc-900" : "text-zinc-50"
      }`}
    >
      <span className="font-mono tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </span>
    </div>
  );
}
