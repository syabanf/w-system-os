"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { type AppModuleId, APP_MODULE_MAP } from "@/constants/appModules";
import { useModuleIcon } from "@/state/iconSet.store";
import { useWindowStore, type WindowBounds } from "@/state/window.store";
import { useAccent } from "@/hooks/useAccent";
import { cn } from "@/lib/cn";
import { WindowHeader } from "./WindowHeader";

interface AppWindowProps {
  id: AppModuleId;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  subtitle?: string;
}

const MIN_W = 480;
const MIN_H = 320;
/** Reserve space for top menu bar (≈48px) + dock (≈108px). */
const TOP_INSET = 56;
const BOTTOM_INSET = 116;
const SIDE_INSET = 12;

function defaultBoundsFor(index: number, vw: number, vh: number): WindowBounds {
  const width = Math.min(1280, vw - SIDE_INSET * 2);
  const height = Math.max(MIN_H, vh - TOP_INSET - BOTTOM_INSET);
  // Cascade subsequent windows by a small offset so opening two doesn't perfectly
  // overlap them and look like a single window.
  const cascade = (index % 6) * 24;
  return {
    x: Math.max(SIDE_INSET, Math.round((vw - width) / 2) + cascade),
    y: TOP_INSET + cascade,
    width,
    height,
  };
}

function clampBounds(b: WindowBounds, vw: number, vh: number): WindowBounds {
  const width = Math.max(MIN_W, Math.min(b.width, vw - SIDE_INSET * 2));
  const height = Math.max(MIN_H, Math.min(b.height, vh - TOP_INSET - BOTTOM_INSET));
  const x = Math.max(SIDE_INSET, Math.min(b.x, vw - width - SIDE_INSET));
  const y = Math.max(TOP_INSET, Math.min(b.y, vh - height - BOTTOM_INSET));
  return { x, y, width, height };
}

export function AppWindow({ id, children, rightSlot, subtitle }: AppWindowProps) {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  const focused = useWindowStore((s) => s.focused);
  const closeApp = useWindowStore((s) => s.closeApp);
  const focusApp = useWindowStore((s) => s.focusApp);
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const setBounds = useWindowStore((s) => s.setBounds);

  const win = windows[id];
  const appModule = APP_MODULE_MAP[id];
  const accent = useAccent(appModule);
  const iconFor = useModuleIcon();

  // Track viewport so default bounds and clamping stay correct on resize.
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Live bounds while dragging/resizing — kept in local state for a smooth
  // 60fps feel, then committed to the store on pointer up. A ref shadows the
  // same value so the pointerup handler can read the latest without going
  // through a setState updater (which mustn't mutate other components' state).
  const idx = Math.max(0, order.indexOf(id));
  const fallback = defaultBoundsFor(idx, viewport.w, viewport.h);
  const [liveBounds, setLiveBounds] = useState<WindowBounds | null>(null);
  const liveBoundsRef = useRef<WindowBounds | null>(null);

  if (!win || win.isMinimized) return null;

  const isFocused = focused === id;
  const isMax = win.isMaximized;
  const bounds: WindowBounds = liveBounds ?? win.bounds ?? fallback;

  const beginDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMax) return;
    // Ignore drag if user clicked a control or interactive element in the header.
    const target = e.target as HTMLElement;
    if (target.closest("button, input, select, a, [data-no-drag]")) return;
    e.preventDefault();
    focusApp(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const start = bounds;
    const onMove = (ev: PointerEvent) => {
      const next = clampBounds(
        { x: start.x + (ev.clientX - startX), y: start.y + (ev.clientY - startY), width: start.width, height: start.height },
        window.innerWidth,
        window.innerHeight,
      );
      liveBoundsRef.current = next;
      setLiveBounds(next);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      const last = liveBoundsRef.current;
      liveBoundsRef.current = null;
      setLiveBounds(null);
      if (last) setBounds(id, last);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "grabbing";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const beginResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMax) return;
    e.preventDefault();
    e.stopPropagation();
    focusApp(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const start = bounds;
    const onMove = (ev: PointerEvent) => {
      const next = clampBounds(
        { x: start.x, y: start.y, width: start.width + (ev.clientX - startX), height: start.height + (ev.clientY - startY) },
        window.innerWidth,
        window.innerHeight,
      );
      liveBoundsRef.current = next;
      setLiveBounds(next);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      const last = liveBoundsRef.current;
      liveBoundsRef.current = null;
      setLiveBounds(null);
      if (last) setBounds(id, last);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "se-resize";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <motion.section
      role="dialog"
      aria-label={appModule.name}
      onMouseDown={() => {
        if (focused !== id) focusApp(id);
      }}
      initial={{ opacity: 0, scale: 0.96, y: 14 }}
      // Focus depth: the focused window sits at full scale; unfocused windows
      // recede slightly so the z-order reads spatially.
      animate={{ opacity: 1, scale: isFocused ? 1 : 0.985, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 14 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "glass-strong absolute overflow-hidden rounded-[24px] text-zinc-100 ring-1 ring-white/8",
        "transition-shadow duration-300",
        isFocused
          ? "shadow-[0_52px_130px_-20px_rgba(0,0,0,0.8)]"
          : "shadow-[0_18px_70px_-28px_rgba(0,0,0,0.6)] saturate-[0.92]",
        isMax && "inset-x-4 top-12 bottom-24",
      )}
      style={{
        position: "absolute",
        zIndex: win.zIndex,
        ...(isMax
          ? { left: 16, right: 16, top: 48, bottom: 96 }
          : {
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
            }),
      }}
    >
      {isFocused ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/15"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 0 60px -10px rgba(255,255,255,0.18)" }}
        />
      ) : null}

      <DragSurface
        onPointerDown={beginDrag}
        onDoubleClick={() => toggleMaximize(id)}
        cursor={isMax ? "default" : "grab"}
      >
        <WindowHeader
          title={appModule.name}
          subtitle={subtitle ?? appModule.shortName}
          icon={iconFor(appModule)}
          accent={accent}
          focused={isFocused}
          onClose={() => closeApp(id)}
          onMinimize={() => toggleMinimize(id)}
          onMaximize={() => toggleMaximize(id)}
          isMaximized={isMax}
          rightSlot={rightSlot}
        />
      </DragSurface>
      <div className="glass-scroll relative h-[calc(100%-50px)] overflow-y-auto overflow-x-hidden">
        {/* Tightened mobile padding; we no longer need the xl: bump since the
            content sets its own internal padding. Smaller window widths get
            more usable horizontal real-estate. */}
        <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 lg:px-6">{children}</div>
      </div>

      {!isMax ? (
        <div
          onPointerDown={beginResize}
          aria-label="Resize window"
          role="separator"
          className="group absolute bottom-0 right-0 z-10 grid h-5 w-5 cursor-se-resize place-items-end p-0.5"
        >
          <span
            aria-hidden
            className="block h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-white/30 transition-colors group-hover:border-white/70"
          />
        </div>
      ) : null}
    </motion.section>
  );
}

/** Thin wrapper so the header gets a `cursor: grab` affordance and dragging
 *  initiates from a pointerdown anywhere in its area (sans controls). */
function DragSurface({
  children,
  onPointerDown,
  onDoubleClick,
  cursor,
}: {
  children: React.ReactNode;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  cursor: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor }}
    >
      {children}
    </div>
  );
}
