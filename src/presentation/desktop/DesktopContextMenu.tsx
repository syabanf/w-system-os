"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUp, Sliders, UserRound } from "lucide-react";
import { WALLPAPERS } from "@/constants/wallpapers";
import { useCurrentWallpaper, useWallpaperStore } from "@/state/wallpaper.store";
import { useDesktopStore } from "@/state/desktop.store";
import { cn } from "@/lib/cn";

export interface ContextMenuAnchor {
  x: number;
  y: number;
}

interface DesktopContextMenuProps {
  menu: ContextMenuAnchor | null;
  onClose: () => void;
}

const MENU_W = 248;
const MENU_H = 240;

/**
 * macOS-style desktop right-click menu. Right-clicking the empty desktop opens
 * it at the cursor with inline wallpaper swatches (apply on click) plus quick
 * actions to change the profile picture and open workspace settings — all
 * reusing the existing wallpaper store + profile dialog.
 */
export function DesktopContextMenu({ menu, onClose }: DesktopContextMenuProps) {
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);
  const current = useCurrentWallpaper();
  const openProfileEdit = useDesktopStore((s) => s.openProfileEdit);
  const toggleSettings = useDesktopStore((s) => s.toggleSettings);

  // Dismiss on scroll / resize / blur / Escape — anything that would leave the
  // anchor stale.
  useEffect(() => {
    if (!menu) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu, onClose]);

  // Clamp so the menu stays fully on-screen.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
  const left = menu ? Math.max(8, Math.min(menu.x, vw - MENU_W - 8)) : 0;
  const top = menu ? Math.max(8, Math.min(menu.y, vh - MENU_H - 8)) : 0;

  return (
    <AnimatePresence>
      {menu ? (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={onClose}
            onContextMenu={(e) => {
              e.preventDefault();
              onClose();
            }}
          />
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{ position: "fixed", left, top, transformOrigin: "top left" }}
            className="menu-surface z-[61] w-[248px] overflow-hidden rounded-xl border border-white/10 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="px-1.5 pb-1">
              <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Wallpaper
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setWallpaper(w.id);
                      onClose();
                    }}
                    aria-label={`Use ${w.name} wallpaper`}
                    title={w.name}
                    className={cn(
                      "h-8 rounded-md ring-1 ring-white/10 transition-transform hover:scale-105",
                      current.id === w.id && "ring-2 ring-white/80",
                    )}
                    style={{ background: w.css }}
                  />
                ))}
              </div>
            </div>

            <div className="my-1.5 h-px bg-white/8" />

            <ContextItem
              icon={ImageUp}
              onClick={() => {
                onClose();
                openProfileEdit();
              }}
            >
              Change profile picture…
            </ContextItem>
            <ContextItem
              icon={UserRound}
              onClick={() => {
                onClose();
                openProfileEdit();
              }}
            >
              Edit profile…
            </ContextItem>
            <ContextItem
              icon={Sliders}
              onClick={() => {
                onClose();
                toggleSettings();
              }}
            >
              Workspace settings…
            </ContextItem>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ContextItem({
  icon: Icon,
  children,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[11px] text-zinc-200 transition-colors hover:bg-white/8"
    >
      <Icon className="h-3.5 w-3.5 text-zinc-400" />
      {children}
    </button>
  );
}
