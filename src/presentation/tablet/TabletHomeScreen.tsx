"use client";

import { motion } from "framer-motion";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useWindowStore } from "@/state/window.store";
import { useSpotlightStore } from "@/state/spotlight.store";
import { Search, Sparkles } from "lucide-react";

const DOCK_IDS: AppModuleId[] = ["dashboard", "leads", "projects", "finance", "support"];

interface TabletIconProps {
  module: AppModule;
  index?: number;
  size?: "grid" | "dock";
  onClick: () => void;
}

function TabletIcon({ module, index = 0, size = "grid", onClick }: TabletIconProps) {
  const tile = module.accentLight;
  const Icon = module.icon;
  const tileClass = size === "grid"
    ? "h-[78px] w-[78px] rounded-[28%]"
    : "h-[58px] w-[58px] rounded-[28%]";
  const iconClass = size === "grid" ? "h-[44px] w-[44px]" : "h-[32px] w-[32px]";

  const tileEl = (
    <span
      className={`grid place-items-center transition-transform group-hover:-translate-y-1 group-active:scale-95 ${tileClass}`}
      style={{
        background: `linear-gradient(150deg, ${tile} 0%, ${tile}d9 100%)`,
        boxShadow: `0 10px 30px -10px ${tile}66, inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.25)`,
      }}
    >
      <Icon
        className={`text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.30)] ${iconClass}`}
        strokeWidth={2.2}
      />
    </span>
  );

  if (size === "dock") {
    return (
      <button onClick={onClick} aria-label={`Open ${module.name}`} className="group">
        {tileEl}
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.025, type: "spring", stiffness: 320, damping: 22 }}
      className="group flex flex-col items-center gap-2"
    >
      {tileEl}
      <span className="text-xs font-medium text-zinc-100/95 drop-shadow">
        {module.shortName}
      </span>
    </motion.button>
  );
}

export function TabletHomeScreen() {
  const openApp = useWindowStore((s) => s.openApp);
  const openSpotlight = useSpotlightStore((s) => s.open);

  const dockSet = new Set(DOCK_IDS);
  const gridApps = APP_MODULES.filter((m) => !dockSet.has(m.id));
  const dockApps = DOCK_IDS.map((id) => APP_MODULES.find((m) => m.id === id)!).filter(Boolean);

  return (
    <div className="flex h-full flex-col px-10 pb-3 pt-3">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-300/80">Good morning</div>
          <div className="text-3xl font-semibold tracking-tight text-zinc-50">Damar Wicaksono</div>
          <div className="mt-0.5 text-xs text-zinc-300/70">
            Monday, 18 May · 7 signals waiting in your inbox
          </div>
        </div>
        <button
          onClick={openSpotlight}
          className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/8"
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <kbd className="rounded bg-white/10 px-1.5 text-[9px] text-zinc-300">⌘K</kbd>
        </button>
      </div>

      <div className="grid flex-1 grid-cols-6 content-start gap-x-6 gap-y-6 py-4">
        {gridApps.map((module, i) => (
          <TabletIcon key={module.id} module={module} index={i} onClick={() => openApp(module.id)} />
        ))}
      </div>

      <div className="glass-soft mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
        <Sparkles className="h-4 w-4 text-zinc-200" />
        <div className="flex-1 text-xs text-zinc-200">
          <span className="font-semibold">Tip:</span> tap any app icon to launch fullscreen, or press
          ⌘K to open Spotlight search.
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="glass-strong flex items-center gap-2 rounded-[26px] px-3 py-2 shadow-[0_22px_70px_-25px_rgba(0,0,0,0.7)]">
          {dockApps.map((module) => (
            <TabletIcon key={module.id} module={module} size="dock" onClick={() => openApp(module.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
