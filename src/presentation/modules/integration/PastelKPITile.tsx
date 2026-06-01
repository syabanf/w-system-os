"use client";

import { cn } from "@/lib/cn";

export type PastelTone = "cream" | "mint" | "blue" | "lilac";

interface PastelKPITileProps {
  tone: PastelTone;
  value: string;
  label: string;
  className?: string;
}

/** PDF-spec pastel tiles. Hex backgrounds are intentionally explicit (not
 *  Tailwind tokens) because the design calls for these exact pastels in both
 *  modes — globals.css doesn't remap raw inline background colors, so this
 *  reads consistently across dark + light themes. */
const TONE_BG: Record<PastelTone, string> = {
  cream: "#FDF6E3",
  mint: "#D7F4E2",
  blue: "#DDE9F7",
  lilac: "#EDDFF6",
};

/** Slate-ish ink for the value + label. Stays readable on every pastel above. */
const INK = "#1f2933";
const INK_MUTED = "#4b5563";

export function PastelKPITile({ tone, value, label, className }: PastelKPITileProps) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-[20px] p-4 md:p-5",
        className,
      )}
      style={{ background: TONE_BG[tone] }}
    >
      <div
        className="text-3xl font-bold leading-none tracking-tight"
        style={{ color: INK }}
      >
        {value}
      </div>
      <div
        className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: INK_MUTED }}
      >
        {label}
      </div>
    </div>
  );
}
