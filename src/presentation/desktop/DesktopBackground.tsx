"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { DEFAULT_WALLPAPER_ID } from "@/constants/wallpapers";
import { useCurrentWallpaper, useWallpaperStore } from "@/state/wallpaper.store";

const VIGNETTE =
  "radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.30) 70%, rgba(0,0,0,0.55) 100%)";

export function DesktopBackground() {
  const hydrate = useWallpaperStore((s) => s.hydrate);
  const wallpaper = useCurrentWallpaper();
  const reduce = useReducedMotion();
  const bgRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Mouse parallax: the wallpaper and the vignette drift opposite the cursor at
  // different depths, giving the desktop layered motion behind the windows. The
  // base is pre-scaled so the drift never reveals an edge. Skipped for reduced
  // motion and on touch (no hovering cursor).
  useEffect(() => {
    if (reduce) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        if (bgRef.current) {
          bgRef.current.style.transform = `scale(1.06) translate3d(${dx * -22}px, ${dy * -22}px, 0)`;
        }
        if (vignetteRef.current) {
          vignetteRef.current.style.transform = `scale(1.12) translate3d(${dx * -38}px, ${dy * -38}px, 0)`;
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const isDefault = wallpaper.id === DEFAULT_WALLPAPER_ID;

  return (
    <>
      <div
        ref={bgRef}
        className={cn(
          "desktop-grain absolute inset-0 -z-10 will-change-transform transition-transform duration-300 ease-out",
          isDefault && "desktop-bg",
        )}
        style={
          isDefault
            ? { transform: "scale(1.06)" }
            : { background: wallpaper.css, transform: "scale(1.06)" }
        }
      />
      <span
        ref={vignetteRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 will-change-transform transition-transform duration-500 ease-out"
        style={{ background: VIGNETTE, transform: "scale(1.12)" }}
      />
    </>
  );
}
