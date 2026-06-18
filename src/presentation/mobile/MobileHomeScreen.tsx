"use client";

import { motion } from "framer-motion";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useSetupStore } from "@/state/setup.store";
import { useProfileStore } from "@/state/profile.store";
import { useWindowStore } from "@/state/window.store";
import { formatDemoToday } from "@/lib/date";

const DOCK_IDS: AppModuleId[] = ["dashboard", "leads", "projects", "finance"];

interface MobileIconProps {
  module: AppModule;
  index?: number;
  size?: "grid" | "dock";
  onClick: () => void;
}

function MobileIcon({ module, index = 0, size = "grid", onClick }: MobileIconProps) {
  const tile = module.accentLight;
  const Icon = module.icon;
  const tileClass = size === "grid"
    ? "h-[60px] w-[60px] rounded-[28%]"
    : "h-[54px] w-[54px] rounded-[28%]";

  const tileEl = (
    <span
      className={`grid place-items-center transition-transform group-active:scale-90 ${tileClass}`}
      style={{
        background: `linear-gradient(150deg, ${tile} 0%, ${tile}d9 100%)`,
        boxShadow: `0 8px 22px -10px ${tile}66, inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.22)`,
      }}
    >
      <Icon
        className={`text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.30)] ${
          size === "grid" ? "h-[34px] w-[34px]" : "h-[30px] w-[30px]"
        }`}
        strokeWidth={2.4}
      />
    </span>
  );

  if (size === "dock") {
    return (
      <button onClick={onClick} className="group flex flex-col items-center" aria-label={`Open ${module.name}`}>
        {tileEl}
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.025, type: "spring", stiffness: 320, damping: 22 }}
      className="group flex flex-col items-center gap-1.5"
    >
      {tileEl}
      <span className="text-[10px] font-medium text-zinc-100/95 drop-shadow">
        {module.shortName}
      </span>
    </motion.button>
  );
}

export function MobileHomeScreen() {
  const openApp = useWindowStore((s) => s.openApp);
  const enabled = useSetupStore((s) => s.enabled);
  const profile = useProfileStore((s) => s.profile);

  const dockSet = new Set(DOCK_IDS);
  const enabledSet = new Set(enabled);
  const gridApps = APP_MODULES.filter((m) => !dockSet.has(m.id) && enabledSet.has(m.id));
  const dockApps = DOCK_IDS.map((id) => APP_MODULES.find((m) => m.id === id)).filter(
    (m): m is AppModule => m !== undefined && enabledSet.has(m.id),
  );

  return (
    <div className="flex h-full flex-col px-6 pb-3 pt-2">
      <div className="mb-3 px-1">
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-300/80">Good morning</div>
        <div className="text-2xl font-semibold tracking-tight text-zinc-50">{profile.name}</div>
        <div className="mt-0.5 text-[11px] text-zinc-300/70">
          {formatDemoToday()} · 7 signals waiting
        </div>
      </div>

      <div className="grid flex-1 grid-cols-4 content-start gap-x-3 gap-y-4 py-3">
        {gridApps.map((module, i) => (
          <MobileIcon key={module.id} module={module} index={i} onClick={() => openApp(module.id)} />
        ))}
      </div>

      <div className="mb-3 flex justify-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
      </div>

      <div className="glass-strong mx-auto flex items-center gap-3 rounded-[26px] px-3.5 py-2.5 shadow-[0_18px_60px_-20px_rgba(0,0,0,0.65)]">
        {dockApps.map((module) => (
          <MobileIcon key={module.id} module={module} size="dock" onClick={() => openApp(module.id)} />
        ))}
      </div>
    </div>
  );
}
