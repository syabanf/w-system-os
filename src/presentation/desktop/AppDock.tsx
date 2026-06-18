"use client";

import { motion } from "framer-motion";
import { type AppModule, type AppModuleId } from "@/constants/appModules";
import { useWindowStore } from "@/state/window.store";
import { useEnabledModules } from "@/state/setup.store";
import { ModuleIcon } from "@/presentation/shared/ModuleIcon";
import { preloadModule } from "@/presentation/desktop/WindowManager";
import { cn } from "@/lib/cn";

interface DockIconProps {
  module: AppModule;
  open: boolean;
  isFocused: boolean;
  onClick: () => void;
}

function DockIcon({ module, open, isFocused, onClick }: DockIconProps) {
  const tile = module.accentLight;
  // Warm this module's chunk as soon as the user hovers or tabs to the icon,
  // so a subsequent click opens it without waiting on a network round-trip.
  const prefetch = () => preloadModule(module.id);
  return (
    <button
      onClick={onClick}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      className="group relative flex flex-col items-center"
      title={module.name}
    >
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-[28%] transition-all duration-200",
          "group-hover:-translate-y-1.5 group-hover:scale-110",
          isFocused ? "ring-2 ring-white/35" : "",
        )}
        style={{
          background: `linear-gradient(150deg, ${tile} 0%, ${tile}d9 100%)`,
          boxShadow: isFocused
            ? `0 14px 32px -10px ${tile}aa, inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.25)`
            : `0 6px 18px -8px ${tile}66, inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.22)`,
        }}
      >
        <ModuleIcon module={module} className="h-[26px] w-[26px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.30)]" strokeWidth={2.5} />
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-1 h-1 w-1 rounded-full transition-opacity",
          open ? "bg-zinc-100" : "bg-transparent",
        )}
      />
      <span
        aria-hidden
        className={cn(
          // text-white (not text-zinc-100) so the label stays white in BOTH themes —
          // the global remap layer would otherwise flip text-zinc-100 to slate
          // in light mode, leaving dark-on-dark inside the always-dark pill.
          "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900/95 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)] ring-1 ring-white/15 transition-opacity",
          "group-hover:opacity-100",
        )}
      >
        {module.shortName}
      </span>
    </button>
  );
}

export function AppDock() {
  const windows = useWindowStore((s) => s.windows);
  const focused = useWindowStore((s) => s.focused);
  const openApp = useWindowStore((s) => s.openApp);
  const restore = useWindowStore((s) => s.restore);
  const modules = useEnabledModules();

  const handleClick = (id: AppModuleId) => {
    const win = windows[id];
    if (!win) return openApp(id);
    if (win.isMinimized) return restore(id);
    openApp(id);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30 flex justify-center">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="glass-strong pointer-events-auto flex items-end gap-1.5 rounded-2xl border border-white/8 px-2.5 py-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
      >
        {modules.map((module) => (
          <DockIcon
            key={module.id}
            module={module}
            open={!!windows[module.id]}
            isFocused={focused === module.id}
            onClick={() => handleClick(module.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}
