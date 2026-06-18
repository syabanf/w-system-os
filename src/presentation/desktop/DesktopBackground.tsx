"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_WALLPAPER_ID } from "@/constants/wallpapers";
import { useCurrentWallpaper, useWallpaperStore } from "@/state/wallpaper.store";

export function DesktopBackground() {
  const hydrate = useWallpaperStore((s) => s.hydrate);
  const wallpaper = useCurrentWallpaper();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // The default "aurora" keeps the theme-aware .desktop-bg class (light/dark
  // variants live in globals.css). Any other preset is painted inline; its css
  // already bakes in the top/bottom chrome darkening.
  const isDefault = wallpaper.id === DEFAULT_WALLPAPER_ID;

  return (
    <>
      <div
        className={cn("desktop-grain absolute inset-0 -z-10", isDefault && "desktop-bg")}
        style={isDefault ? undefined : { background: wallpaper.css }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.30) 70%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}
