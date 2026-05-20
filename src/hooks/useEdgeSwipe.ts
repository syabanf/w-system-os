"use client";

import { useEffect } from "react";
import { useControlCenterStore } from "@/state/controlCenter.store";

/** Wire iOS-style "swipe down from the top edge" gesture to open the Control
 *  Center, and "swipe up from anywhere in the open sheet" to close it.
 *
 *  - Touch start within `TOP_HOTZONE_PX` of the top edge → arms the gesture.
 *  - Drag down updates `dragProgress` continuously for a rubber-band reveal.
 *  - Release after crossing `OPEN_THRESHOLD_PX` → opens; otherwise snaps closed.
 *  - When already open, pointer/touch starting anywhere on the sheet and dragging
 *    UP closes it once it crosses the threshold. */
const TOP_HOTZONE_PX = 36;
const OPEN_THRESHOLD_PX = 90;
const REVEAL_RANGE_PX = 160;

export function useEdgeSwipe(enabled: boolean) {
  const isOpen = useControlCenterStore((s) => s.isOpen);
  const open = useControlCenterStore((s) => s.open);
  const close = useControlCenterStore((s) => s.close);
  const setDragProgress = useControlCenterStore((s) => s.setDragProgress);

  useEffect(() => {
    if (!enabled) return;

    let startY: number | null = null;
    let startX: number | null = null;
    let trackingClose = false;
    let lastDelta = 0;

    const onPointerDown = (e: PointerEvent | TouchEvent) => {
      const point = "touches" in e ? e.touches[0] : (e as PointerEvent);
      if (!point) return;
      const y = (point as Touch | PointerEvent).clientY;
      const x = (point as Touch | PointerEvent).clientX;
      // Arming rule: open gesture must start within the top hotzone AND on the
      // right half of the screen (matches iOS — left edge is reserved for
      // notification-center on iPadOS, right edge for Control Center).
      if (!isOpen && y <= TOP_HOTZONE_PX && x >= window.innerWidth * 0.5) {
        startY = y;
        startX = x;
        trackingClose = false;
        return;
      }
      // Close gesture: only when open AND the touch starts on the sheet itself.
      // We detect via the data attribute set on the panel root.
      if (isOpen) {
        const target = e.target as HTMLElement | null;
        if (target?.closest("[data-control-center]")) {
          startY = y;
          startX = x;
          trackingClose = true;
        }
      }
    };

    const onPointerMove = (e: PointerEvent | TouchEvent) => {
      if (startY === null) return;
      const point = "touches" in e ? e.touches[0] : (e as PointerEvent);
      if (!point) return;
      const y = (point as Touch | PointerEvent).clientY;
      const x = (point as Touch | PointerEvent).clientX;
      const dy = y - startY;
      const dx = x - (startX ?? x);

      // Cancel if the gesture turns horizontal (probably a scroll/swipe within
      // a carousel, not a sheet drag).
      if (Math.abs(dx) > Math.abs(dy) + 12 && Math.abs(dx) > 24) {
        startY = null;
        startX = null;
        return;
      }

      if (trackingClose) {
        // Closing: positive dy means we're pulling DOWN (cancel), negative means
        // pulling UP (close).
        if (dy < 0) {
          const progress = 1 - Math.min(1, -dy / REVEAL_RANGE_PX);
          setDragProgress(progress);
          lastDelta = dy;
          e.preventDefault?.();
        }
      } else {
        // Opening: positive dy reveals the sheet.
        if (dy > 0) {
          const progress = Math.min(1, dy / REVEAL_RANGE_PX);
          setDragProgress(progress);
          lastDelta = dy;
          // Prevent the page from also scrolling while we're handling the drag.
          e.preventDefault?.();
        }
      }
    };

    const onPointerUp = () => {
      if (startY === null) return;
      if (trackingClose) {
        if (-lastDelta > OPEN_THRESHOLD_PX) close();
        else setDragProgress(1);
      } else {
        if (lastDelta > OPEN_THRESHOLD_PX) open();
        else setDragProgress(0);
      }
      startY = null;
      startX = null;
      lastDelta = 0;
      trackingClose = false;
    };

    // Bind to BOTH pointer and touch — Safari iOS doesn't always fire pointer
    // events for system gestures, but touchstart/move/end always fire.
    document.addEventListener("touchstart", onPointerDown as EventListener, { passive: true });
    document.addEventListener("touchmove", onPointerMove as EventListener, { passive: false });
    document.addEventListener("touchend", onPointerUp);
    document.addEventListener("touchcancel", onPointerUp);

    document.addEventListener("pointerdown", onPointerDown as EventListener);
    document.addEventListener("pointermove", onPointerMove as EventListener);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);

    return () => {
      document.removeEventListener("touchstart", onPointerDown as EventListener);
      document.removeEventListener("touchmove", onPointerMove as EventListener);
      document.removeEventListener("touchend", onPointerUp);
      document.removeEventListener("touchcancel", onPointerUp);
      document.removeEventListener("pointerdown", onPointerDown as EventListener);
      document.removeEventListener("pointermove", onPointerMove as EventListener);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
  }, [enabled, isOpen, open, close, setDragProgress]);
}
