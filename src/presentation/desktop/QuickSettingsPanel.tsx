"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bluetooth,
  Focus,
  Monitor,
  Moon,
  Palette,
  Sun,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import { useThemeStore } from "@/state/theme.store";
import { useNotificationStore } from "@/state/notification.store";

export function QuickSettingsPanel() {
  const isSettingsOpen = useDesktopStore((s) => s.isSettingsOpen);
  const toggleSettings = useDesktopStore((s) => s.toggleSettings);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const dnd = useNotificationStore((s) => s.dnd);
  const setDnd = useNotificationStore((s) => s.setDnd);

  return (
    <AnimatePresence>
      {isSettingsOpen ? (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="glass-strong fixed right-3 top-12 z-40 w-[320px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        >
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-zinc-50">Control Center</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Workspace · Damar Wicaksono
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
              <Toggle icon={Wifi} label="Wi-Fi" hint="WIT-OFFICE-5G" active />
              <Toggle icon={Bluetooth} label="Bluetooth" hint="Connected" active />
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
            <Slider icon={Volume2} label="Volume" value={64} />
            <Slider icon={Monitor} label="Brightness" value={82} />
            <div className="glass-soft rounded-xl p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs text-zinc-200">
                  <Palette className="h-3.5 w-3.5 text-zinc-100" />
                  Accent color
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Parchment</span>
              </div>
              <div className="flex gap-2">
                {["#E8C170", "#FAFAF9", "#A1A1AA", "#FBBF24", "#60A5FA", "#34D399"].map((c) => (
                  <button
                    key={c}
                    aria-label={`Use accent ${c}`}
                    className="h-7 w-7 rounded-full ring-1 ring-white/10 transition-transform hover:scale-105"
                    style={{ background: c, boxShadow: `0 0 0 1px ${c}55, 0 6px 14px -4px ${c}66` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
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

interface SliderProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}

function Slider({ icon: Icon, label, value }: SliderProps) {
  return (
    <div className="glass-soft rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 text-zinc-200">
          <Icon className="h-3.5 w-3.5 text-zinc-100" />
          {label}
        </span>
        <span className="font-mono text-zinc-400">{value}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${value}%`,
            background: "linear-gradient(90deg, #FAFAF9 0%, #A1A1AA 100%)",
          }}
        />
      </div>
    </div>
  );
}
