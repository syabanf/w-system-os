"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useWindowStore } from "@/state/window.store";
import { useAccent } from "@/hooks/useAccent";
import { cn } from "@/lib/cn";

interface DrawerIconProps {
  module: AppModule;
  active: boolean;
  onSelect: () => void;
}

function DrawerIcon({ module, active, onSelect }: DrawerIconProps) {
  const accent = useAccent(module);
  const Icon = module.icon;
  return (
    <button
      onClick={onSelect}
      className="group flex flex-col items-center gap-1.5"
      aria-label={`Switch to ${module.name}`}
    >
      <span
        className={cn(
          "grid h-[60px] w-[60px] place-items-center rounded-[18px] border border-white/12 transition-transform group-active:scale-90",
          active && "ring-1 ring-white/40",
        )}
        style={{
          background: `linear-gradient(135deg, ${accent}55 0%, var(--icon-tile-base) 95%)`,
          boxShadow:
            "0 8px 22px -10px var(--icon-tile-shadow), inset 0 1px 0 var(--icon-tile-inner)",
        }}
      >
        <Icon className="h-7 w-7" style={{ color: accent }} />
      </span>
      <span className="text-[10px] font-medium text-zinc-100/95">{module.shortName}</span>
    </button>
  );
}

interface MobileAppDrawerProps {
  open: boolean;
  onClose: () => void;
  activeId?: AppModuleId;
}

export function MobileAppDrawer({ open, onClose, activeId }: MobileAppDrawerProps) {
  const openApp = useWindowStore((s) => s.openApp);

  const handleSelect = (id: AppModuleId) => {
    openApp(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-40 flex flex-col justify-end bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative rounded-t-[28px] border-t border-white/12 px-5 pb-6 pt-3"
          >
            <button
              aria-label="Pull down"
              onClick={onClose}
              className="mx-auto mb-3 block h-1 w-12 rounded-full bg-white/35"
            />
            <header className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-300/70">
                  App library
                </div>
                <div className="text-sm font-semibold text-zinc-50">All apps</div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {APP_MODULES.map((module) => (
                <DrawerIcon
                  key={module.id}
                  module={module}
                  active={activeId === module.id}
                  onSelect={() => handleSelect(module.id)}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
