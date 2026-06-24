"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Focus,
  Image as ImageIcon,
  LayoutGrid,
  Moon,
  Shapes,
  Sun,
  X,
} from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import { useThemeStore } from "@/state/theme.store";
import { useNotificationStore } from "@/state/notification.store";
import { useSetupStore } from "@/state/setup.store";
import { useProfileStore } from "@/state/profile.store";
import { useCurrentWallpaper, useWallpaperStore } from "@/state/wallpaper.store";
import { WALLPAPERS } from "@/constants/wallpapers";
import { useIconSetStore } from "@/state/iconSet.store";
import { ICON_SETS, previewIcons } from "@/constants/iconSets";
import { DismissLayer } from "@/presentation/shared/DismissLayer";
import { cn } from "@/lib/cn";

export function QuickSettingsPanel() {
  const isSettingsOpen = useDesktopStore((s) => s.isSettingsOpen);
  const toggleSettings = useDesktopStore((s) => s.toggleSettings);
  const closeAllPanels = useDesktopStore((s) => s.closeAllPanels);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const dnd = useNotificationStore((s) => s.dnd);
  const setDnd = useNotificationStore((s) => s.setDnd);
  const reopenSetup = useSetupStore((s) => s.reopen);
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);
  const wallpaper = useCurrentWallpaper();
  const profile = useProfileStore((s) => s.profile);
  const iconSetId = useIconSetStore((s) => s.id);
  const setIconSet = useIconSetStore((s) => s.setIconSet);

  return (
    <>
      {isSettingsOpen ? <DismissLayer onDismiss={closeAllPanels} /> : null}
      <AnimatePresence>
      {isSettingsOpen ? (
        <motion.aside
          // macOS Control Center: drops down from its top-right menu-bar icon
          // (scale + fade from the top-right origin) rather than sliding in from
          // the right edge — that edge-slide is reserved for Notification Center.
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          // position:fixed inline so it beats .glass-strong's `position: relative`
          // (otherwise the panel falls back to in-flow at the top-left).
          style={{ position: "fixed", transformOrigin: "top right" }}
          className="glass-strong fixed right-3 top-12 z-40 w-[320px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        >
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-zinc-50">Control Center</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Workspace · {profile.name}
              </div>
            </div>
            <button
              onClick={toggleSettings}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/8 hover:text-zinc-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>
          <div className="space-y-3 p-4">
            <div className="glass-soft grid grid-cols-2 gap-2 rounded-xl p-3">
              <Toggle
                icon={Focus}
                label="Do Not Disturb"
                hint={dnd ? "Silencing alerts" : "Alerts on"}
                active={dnd}
                onClick={() => setDnd(!dnd)}
              />
              <Toggle
                icon={theme === "dark" ? Moon : Sun}
                label="Theme"
                hint={theme === "dark" ? "Dark mode" : "Light mode"}
                active
                onClick={toggleTheme}
              />
            </div>
            <div className="glass-soft rounded-xl p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs text-zinc-200">
                  <ImageIcon className="h-3.5 w-3.5 text-zinc-100" />
                  Wallpaper
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {wallpaper.name}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWallpaper(w.id)}
                    aria-label={`Use ${w.name} wallpaper`}
                    title={w.name}
                    className={cn(
                      "h-10 rounded-lg ring-1 ring-white/10 transition-transform hover:scale-105",
                      wallpaper.id === w.id && "ring-2 ring-white/80",
                    )}
                    style={{ background: w.css }}
                  />
                ))}
              </div>
            </div>
            <div className="glass-soft rounded-xl p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs text-zinc-200">
                  <Shapes className="h-3.5 w-3.5 text-zinc-100" />
                  App icons
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {ICON_SETS.find((s) => s.id === iconSetId)?.name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ICON_SETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setIconSet(s.id)}
                    aria-label={`Use ${s.name} icons`}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 transition-colors",
                      iconSetId === s.id
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20",
                    )}
                  >
                    <span className="flex gap-1">
                      {previewIcons(s.id)
                        .slice(0, 3)
                        .map((Ic, i) => (
                          <Ic key={i} className="h-3.5 w-3.5 text-zinc-100" />
                        ))}
                    </span>
                    <span className="text-[9px] text-zinc-300">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                reopenSetup();
                closeAllPanels();
              }}
              className="qs-toggle qs-toggle--inactive group flex w-full items-center gap-2 rounded-xl border border-white/8 px-3 py-2.5 text-left transition-all hover:border-white/20 active:scale-[0.98]"
            >
              <span className="qs-toggle-ico grid h-7 w-7 place-items-center rounded-md text-zinc-300">
                <LayoutGrid className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-zinc-100">
                  Set up workspace
                </span>
                <span className="block truncate text-[9px] uppercase tracking-wider text-zinc-500">
                  Choose enabled modules
                </span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
            </button>
          </div>
        </motion.aside>
      ) : null}
      </AnimatePresence>
    </>
  );
}

interface ToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

function Toggle({ icon: Icon, label, hint, active, onClick }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      // Both states get a visible hover delta in both themes:
      //  · inactive → softer base, deepens on hover
      //  · active   → already-filled base, lifts further on hover so the
      //               press feedback is unambiguous (was missing before).
      // `qs-toggle` carries the theme-aware fills that globals.css owns —
      // keeps the active-color logic centralized instead of fighting the
      // bg-white/X remap layer.
      className={`qs-toggle group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all active:scale-[0.98] ${
        active
          ? "qs-toggle--active border-white/25"
          : "qs-toggle--inactive border-white/8"
      }`}
    >
      <span
        className={`qs-toggle-ico grid h-7 w-7 place-items-center rounded-md transition-colors ${
          active ? "qs-toggle-ico--active text-zinc-50" : "text-zinc-300"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-medium text-zinc-100">{label}</span>
        {hint ? (
          <span className="block truncate text-[9px] uppercase tracking-wider text-zinc-500">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}
