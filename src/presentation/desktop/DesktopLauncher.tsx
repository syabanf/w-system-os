"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useDesktopStore } from "@/state/desktop.store";
import { useWindowStore } from "@/state/window.store";
import { cn } from "@/lib/cn";

interface LauncherTileProps {
  module: AppModule;
  isOpen: boolean;
  onLaunch: () => void;
}

function LauncherTile({ module, isOpen, onLaunch }: LauncherTileProps) {
  const tile = module.accentLight;
  const Icon = module.icon;
  return (
    <motion.button
      onClick={onLaunch}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group flex flex-col items-center gap-2 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
      aria-label={`Launch ${module.name}`}
    >
      <span
        className={cn(
          "grid h-[78px] w-[78px] place-items-center rounded-[28%] transition-transform group-hover:-translate-y-1 group-active:scale-95",
          isOpen && "ring-2 ring-white/40",
        )}
        style={{
          background: `linear-gradient(150deg, ${tile} 0%, ${tile}d9 100%)`,
          boxShadow: `0 12px 28px -12px ${tile}66, inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.25)`,
        }}
      >
        <Icon className="h-[44px] w-[44px] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.30)]" strokeWidth={2.2} />
      </span>
      <div className="text-center">
        <div className="text-xs font-semibold text-zinc-100">{module.shortName}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
          {module.group}
        </div>
      </div>
    </motion.button>
  );
}

export function DesktopLauncher() {
  const isOpen = useDesktopStore((s) => s.isLauncherOpen);
  const closeLauncher = useDesktopStore((s) => s.closeLauncher);
  const openApp = useWindowStore((s) => s.openApp);
  const openWindows = useWindowStore((s) => s.windows);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLauncher();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeLauncher]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APP_MODULES;
    return APP_MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q),
    );
  }, [query]);

  const launch = (id: AppModuleId) => {
    openApp(id);
    closeLauncher();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-md"
          onClick={closeLauncher}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong absolute left-1/2 top-1/2 w-[min(880px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-zinc-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter apps…"
                  className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-zinc-300">ESC</kbd>
              </div>
              <button
                onClick={closeLauncher}
                aria-label="Close launcher"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="px-5 pb-5 pt-3">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                <span>App library · {filtered.length} of {APP_MODULES.length}</span>
                <span>Click to launch · ⌘K for Spotlight</span>
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-zinc-400">
                  No apps match “{query}”.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-x-3 gap-y-2 md:grid-cols-6">
                  {filtered.map((module) => (
                    <LauncherTile
                      key={module.id}
                      module={module}
                      isOpen={!!openWindows[module.id]}
                      onLaunch={() => launch(module.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
