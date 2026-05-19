"use client";

import { Grid3x3 } from "lucide-react";
import { APP_MODULE_MAP, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useWindowStore } from "@/state/window.store";
import { cn } from "@/lib/cn";

const LAUNCHER_IDS: AppModuleId[] = ["dashboard", "leads", "projects", "finance"];

interface LauncherIconProps {
  module: AppModule;
  active: boolean;
  onClick: () => void;
}

function LauncherIcon({ module, active, onClick }: LauncherIconProps) {
  const tile = module.accentLight;
  const Icon = module.icon;
  return (
    <button
      onClick={onClick}
      aria-label={`Switch to ${module.name}`}
      className="group flex flex-col items-center gap-1"
    >
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-[28%] transition-transform active:scale-90",
          active && "ring-2 ring-white/40",
        )}
        style={{
          background: `linear-gradient(150deg, ${tile} 0%, ${tile}d9 100%)`,
          boxShadow: `0 6px 14px -8px ${tile}66, inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.22)`,
        }}
      >
        <Icon className="h-[22px] w-[22px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
      </span>
      <span
        aria-hidden
        className={cn(
          "h-0.5 w-0.5 rounded-full transition-opacity",
          active ? "bg-zinc-100 opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

interface MobileLauncherProps {
  activeId?: AppModuleId;
  onOpenDrawer: () => void;
}

export function MobileLauncher({ activeId, onOpenDrawer }: MobileLauncherProps) {
  const openApp = useWindowStore((s) => s.openApp);

  return (
    <div className="mx-auto mb-1.5 mt-1 flex justify-center">
      <div className="glass-strong flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-1.5 shadow-[0_14px_40px_-15px_rgba(0,0,0,0.55)]">
        {LAUNCHER_IDS.map((id) => {
          const module = APP_MODULE_MAP[id];
          return (
            <LauncherIcon
              key={id}
              module={module}
              active={activeId === id}
              onClick={() => openApp(id)}
            />
          );
        })}
        <span aria-hidden className="mx-0.5 h-7 w-px bg-white/12" />
        <button
          onClick={onOpenDrawer}
          aria-label="Open app library"
          className="group flex flex-col items-center gap-1"
        >
          <span
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 text-zinc-200 transition-transform active:scale-90"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, var(--icon-tile-base) 95%)",
              boxShadow:
                "0 6px 14px -8px var(--icon-tile-shadow), inset 0 1px 0 var(--icon-tile-inner)",
            }}
          >
            <Grid3x3 className="h-4 w-4" />
          </span>
          <span aria-hidden className="h-0.5 w-0.5 rounded-full opacity-0" />
        </button>
      </div>
    </div>
  );
}
