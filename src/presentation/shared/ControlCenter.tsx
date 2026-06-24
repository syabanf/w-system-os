"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AirVent,
  Battery,
  Bell,
  BellOff,
  Bluetooth,
  Focus,
  Image as ImageIcon,
  Lock,
  Moon,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  SunMedium,
  UserRound,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useControlCenterStore } from "@/state/controlCenter.store";
import { useThemeStore } from "@/state/theme.store";
import { useDesktopStore } from "@/state/desktop.store";
import { useSpotlightStore } from "@/state/spotlight.store";
import { useReddieStore } from "@/state/reddie.store";
import { useNotificationStore } from "@/state/notification.store";
import { useCurrentWallpaper, useWallpaperStore } from "@/state/wallpaper.store";
import { WALLPAPERS } from "@/constants/wallpapers";
import { cn } from "@/lib/cn";

/** iOS-style Control Center sheet. Renders nothing when neither open nor
 *  mid-drag, so it doesn't intercept pointer events on the home screen. */
export function ControlCenter() {
  const isOpen = useControlCenterStore((s) => s.isOpen);
  const dragProgress = useControlCenterStore((s) => s.dragProgress);
  const close = useControlCenterStore((s) => s.close);

  // Mid-drag preview rendering — the sheet is visible at partial opacity while
  // the gesture is in progress, then snaps to fully open or closed on release.
  const showSheet = isOpen || dragProgress > 0;
  const previewY = isOpen ? 0 : -100 + dragProgress * 100;
  const previewOpacity = isOpen ? 1 : dragProgress;

  // Esc closes; matches the desktop right-rail panels' affordance.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {showSheet ? (
        <motion.div
          key="cc-backdrop"
          data-control-center
          initial={{ opacity: 0 }}
          animate={{ opacity: previewOpacity * 0.55 + 0.05 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm"
        />
      ) : null}
      {showSheet ? (
        <motion.section
          key="cc-sheet"
          data-control-center
          role="dialog"
          aria-label="Control Center"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: isOpen ? 0 : `${previewY}%`, opacity: previewOpacity }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={
            isOpen
              ? { type: "spring", stiffness: 360, damping: 32 }
              : { duration: 0 } // follow the drag in real-time, no spring overshoot
          }
          className={cn(
            "fixed inset-x-0 top-0 z-[80] mx-auto max-w-[640px]",
            "rounded-b-[28px] border border-white/10 border-t-0",
            "bg-[rgba(20,18,32,0.86)] backdrop-blur-2xl",
            "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]",
          )}
        >
          <ControlCenterContent />
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

function ControlCenterContent() {
  const close = useControlCenterStore((s) => s.close);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const toggleNotifications = useDesktopStore((s) => s.toggleNotifications);
  const openProfileEdit = useDesktopStore((s) => s.openProfileEdit);
  const toggleSpotlight = useSpotlightStore((s) => s.toggle);
  const openReddie = useReddieStore((s) => s.open);
  const unread = useNotificationStore((s) => s.unread);
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);
  const currentWallpaper = useCurrentWallpaper();

  // Quick toggles persist across sessions (Wi-Fi, brightness, …) via the store.
  const toggles = useControlCenterStore((s) => s.toggles);
  const flip = useControlCenterStore((s) => s.flip);
  const setToggle = useControlCenterStore((s) => s.setToggle);
  const resetToggles = useControlCenterStore((s) => s.resetToggles);
  const hydrate = useControlCenterStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  const { wifi, bluetooth, airdrop, focusMode, mute, orientationLock, musicPlaying, brightness, volume } =
    toggles;

  return (
    <div className="px-4 pb-5 pt-3">
      {/* Drag handle */}
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />

      {/*  Mobile collapses the 4-col grid into a stack of full-width cards so
            tiles don't truncate. sm: (≥640px) restores iOS-style mosaic. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Connectivity card — spans full width on mobile, 2×2 on sm+ */}
        <div className="col-span-2 grid grid-cols-2 gap-1.5 rounded-[20px] bg-white/[0.06] p-2 sm:row-span-2">
          <ConnectivityTile
            active={wifi}
            onClick={() => flip("wifi")}
            activeIcon={Wifi}
            inactiveIcon={WifiOff}
            label="Wi-Fi"
            sublabel={wifi ? "WIT-Office" : "Off"}
            accent="#3B82F6"
          />
          <ConnectivityTile
            active={bluetooth}
            onClick={() => flip("bluetooth")}
            activeIcon={Bluetooth}
            inactiveIcon={Bluetooth}
            label="Bluetooth"
            sublabel={bluetooth ? "On" : "Off"}
            accent="#06B6D4"
          />
          <ConnectivityTile
            active={airdrop}
            onClick={() => flip("airdrop")}
            activeIcon={AirVent}
            inactiveIcon={AirVent}
            label="AirDrop"
            sublabel={airdrop ? "Contacts" : "Off"}
            accent="#22C55E"
          />
          <ConnectivityTile
            active={focusMode}
            onClick={() => flip("focusMode")}
            activeIcon={Focus}
            inactiveIcon={Focus}
            label="Focus"
            sublabel={focusMode ? "Do Not Disturb" : "Off"}
            accent="#A855F7"
          />
        </div>

        {/* Music card (top-right, 2 cols × 1 row) */}
        <div className="col-span-2 rounded-[20px] bg-white/[0.06] p-3">
          <div className="flex items-start gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#EC4899,#8B5CF6)" }}
            >
              <Music2 className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-zinc-50">
                Quarterly review
              </div>
              <div className="truncate text-[10px] text-zinc-400">Spotify · Focus</div>
            </div>
            <button
              onClick={() => flip("musicPlaying")}
              aria-label={musicPlaying ? "Pause" : "Play"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/12 text-zinc-50 transition-transform active:scale-90"
            >
              {musicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Orientation lock + Mute (single row, 2 cols total, top-right cluster) */}
        <SquareTile
          active={orientationLock}
          onClick={() => flip("orientationLock")}
          icon={Lock}
          label={orientationLock ? "Locked" : "Rotate"}
          accent="#EF4444"
        />
        <SquareTile
          active={mute}
          onClick={() => flip("mute")}
          icon={mute ? BellOff : Bell}
          label={mute ? "Muted" : "Sounds"}
          accent="#F59E0B"
        />
      </div>

      {/* Brightness slider */}
      <SliderRow
        icon={SunMedium}
        label="Brightness"
        value={brightness}
        onChange={(v) => setToggle("brightness", v)}
      />
      {/* Volume slider */}
      <SliderRow
        icon={Volume2}
        label="Volume"
        value={volume}
        onChange={(v) => setToggle("volume", v)}
      />

      {/* Wallpaper picker — the touch equivalent of the desktop right-click
          "change wallpaper" menu. Applies instantly via the wallpaper store. */}
      <div className="mt-2.5 rounded-[22px] bg-white/[0.06] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-zinc-100">
            <ImageIcon className="h-4 w-4" />
            Wallpaper
          </span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            {currentWallpaper.name}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {WALLPAPERS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWallpaper(w.id)}
              aria-label={`Use ${w.name} wallpaper`}
              title={w.name}
              className={cn(
                "h-9 rounded-lg ring-1 ring-white/10 transition-transform active:scale-95",
                currentWallpaper.id === w.id && "ring-2 ring-white/80",
              )}
              style={{ background: w.css }}
            />
          ))}
        </div>
      </div>

      {/* App shortcuts — surface the desktop equivalents on a touch device */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        <ShortcutTile
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Light" : "Dark"}
          onClick={toggleTheme}
        />
        <ShortcutTile
          icon={Search}
          label="Search"
          onClick={() => {
            toggleSpotlight();
            close();
          }}
        />
        <ShortcutTile
          icon={Bell}
          label="Inbox"
          badge={unread > 0 ? (unread > 9 ? "9+" : String(unread)) : null}
          onClick={() => {
            toggleNotifications();
            close();
          }}
        />
        <ShortcutTile
          icon={Sparkles}
          label="Reddie"
          onClick={() => {
            openReddie();
            close();
          }}
          accent="#EC4899"
        />
        <ShortcutTile
          icon={UserRound}
          label="Profile"
          onClick={() => {
            openProfileEdit();
            close();
          }}
        />
      </div>

      {/* Status footer — mirrors iOS battery row */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Battery className="h-3 w-3" />
          <span>92%</span>
        </div>
        <button
          onClick={resetToggles}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
        >
          <RotateCcw className="h-2.5 w-2.5" /> Reset
        </button>
      </div>
    </div>
  );
}

// ── Tiles ──────────────────────────────────────────────────────────────────

function ConnectivityTile({
  active,
  onClick,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
  label,
  sublabel,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  activeIcon: typeof Wifi;
  inactiveIcon: typeof Wifi;
  label: string;
  sublabel: string;
  accent: string;
}) {
  const Icon = active ? ActiveIcon : InactiveIcon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left transition-all",
        "active:scale-[0.97]",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
          active ? "text-white" : "bg-white/10 text-zinc-400",
        )}
        style={active ? { background: accent } : undefined}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-[11px] font-semibold",
            active ? "text-zinc-50" : "text-zinc-200",
          )}
        >
          {label}
        </div>
        <div className="truncate text-[9px] text-zinc-400">{sublabel}</div>
      </div>
    </button>
  );
}

function SquareTile({
  active,
  onClick,
  icon: Icon,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Lock;
  label: string;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square rounded-[20px] p-2.5 text-left transition-all active:scale-[0.95]",
        active ? "" : "bg-white/[0.06]",
      )}
      style={active ? { background: accent } : undefined}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full",
          active ? "bg-white/15 text-white" : "bg-white/10 text-zinc-300",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div
        className={cn(
          "mt-2 text-[10px] font-medium",
          active ? "text-white" : "text-zinc-300",
        )}
      >
        {label}
      </div>
    </button>
  );
}

function SliderRow({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Sun;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-2.5">
      <label className="block">
        <span className="sr-only">{label}</span>
        <div className="relative flex items-center gap-3 rounded-[22px] bg-white/[0.06] px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-zinc-200">
            <Icon className="h-4 w-4" />
          </span>
          <div className="relative flex-1">
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-white/80 to-white"
                style={{ width: `${value}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
              aria-label={label}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-zinc-300 tabular-nums">
            {value}
          </span>
        </div>
      </label>
    </div>
  );
}

function ShortcutTile({
  icon: Icon,
  label,
  onClick,
  accent,
  badge,
}: {
  icon: typeof Sun;
  label: string;
  onClick: () => void;
  accent?: string;
  badge?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1 rounded-2xl bg-white/[0.04] px-2 py-2 transition-transform active:scale-[0.95]"
    >
      <span
        className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/8 text-zinc-100"
        style={accent ? { background: `${accent}22`, color: accent } : undefined}
      >
        <Icon className="h-4 w-4" />
        {badge ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[8px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-zinc-300">{label}</span>
    </button>
  );
}
