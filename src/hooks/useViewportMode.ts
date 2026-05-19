"use client";

import { useEffect, useState } from "react";

export type ViewportMode = "phone" | "tablet" | "desktop";

const PHONE_MAX = 639;
const TABLET_MAX = 1023;

function detect(): ViewportMode {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w <= PHONE_MAX) return "phone";
  if (w <= TABLET_MAX) return "tablet";
  return "desktop";
}

export function useViewportMode(): { mode: ViewportMode; ready: boolean } {
  // SSR renders desktop placeholder; consumers should treat ready=false as
  // "viewport not yet measured" so they don't trigger device-specific effects.
  const [mode, setMode] = useState<ViewportMode>("desktop");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setMode(detect());
    sync();
    setReady(true);
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return { mode, ready };
}
