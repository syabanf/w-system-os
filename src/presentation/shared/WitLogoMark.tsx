"use client";

import { cn } from "@/lib/cn";

interface WitLogoMarkProps {
  size?: number;
  className?: string;
  /** When true, render the wordmark next to the mark. */
  withWordmark?: boolean;
}

/**
 * WIT brand mark — clean monochrome "W" glyph that inherits its parent's text
 * color (no chip, no gradient). Same restraint as Apple's logo in the menu
 * bar: a single silhouette that flips between dark and light automatically.
 */
export function WitLogoMark({ size = 18, className, withWordmark }: WitLogoMarkProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 leading-none", className)}
      aria-label="WIT"
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden
        focusable="false"
      >
        {/* Filled geometric W. Two outer chevrons + centre tick, all solid. */}
        <path d="M3.5 4.6 L1.7 4.6 L5.7 19.4 L9.5 19.4 L12 9.6 L14.5 19.4 L18.3 19.4 L22.3 4.6 L20.5 4.6 L17.1 17.6 L14.6 7.8 L12 7.8 L12 7.8 L9.4 7.8 L6.9 17.6 Z" />
      </svg>
      {withWordmark ? (
        <span
          className="text-[12px] font-semibold tracking-[0.08em]"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          WIT
        </span>
      ) : null}
    </span>
  );
}
