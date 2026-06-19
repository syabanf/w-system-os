"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  /** The final, already-formatted display string (e.g. "Rp 2,2 M", "85.6%",
   *  "16", "Rp 10,4 M pipeline"). The first numeric token counts up from 0; the
   *  surrounding text (currency, suffix, units) is preserved. */
  value: string;
  durationMs?: number;
  className?: string;
}

/**
 * Counts the first numeric token in a formatted string up from zero. Handles
 * Indonesian decimal-comma ("2,2"), decimal-dot ("85.6"), and thousands
 * separators, and falls back to rendering the string verbatim if it can't find
 * a clean number or the user prefers reduced motion.
 */
export function AnimatedNumber({ value, durationMs = 900, className }: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const match = value.match(/\d[\d.,]*/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const raw = match[0];
    // Decimal comma when a single trailing ",d" / ",dd" and no dot-decimal.
    const isDecimalComma = /,\d{1,2}$/.test(raw) && !/\.\d/.test(raw);
    const normalized = isDecimalComma
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
    const target = parseFloat(normalized);
    if (!Number.isFinite(target)) {
      setDisplay(value);
      return;
    }
    const decimals = normalized.split(".")[1]?.length ?? 0;

    const controls = animate(0, target, {
      duration: durationMs / 1000,
      ease: [0.2, 0.9, 0.25, 1],
      onUpdate: (n) => {
        const formatted = isDecimalComma
          ? n.toFixed(decimals).replace(".", ",")
          : decimals > 0
            ? n.toFixed(decimals)
            : Math.round(n).toLocaleString("en-US");
        setDisplay(value.replace(raw, formatted));
      },
    });
    return () => controls.stop();
  }, [value, durationMs, reduce]);

  return <span className={className}>{display}</span>;
}
