"use client";

import { Maximize2, Minus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface WindowHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: string;
  focused: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
  rightSlot?: React.ReactNode;
}

export function WindowHeader({
  title,
  subtitle,
  icon: Icon,
  accent = "#FAFAF9",
  focused,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  rightSlot,
}: WindowHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 border-b border-white/8 px-4 py-2.5",
        "bg-gradient-to-b from-white/[0.04] to-transparent",
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          aria-label="Close"
          onClick={onClose}
          className="group h-3.5 w-3.5 rounded-full bg-[#FF5F57] shadow-inner ring-1 ring-black/30 transition-transform hover:scale-110"
        >
          <X className="m-auto h-2 w-2 opacity-0 transition-opacity group-hover:opacity-80" />
        </button>
        <button
          aria-label="Minimize"
          onClick={onMinimize}
          className="group h-3.5 w-3.5 rounded-full bg-[#FEBC2E] shadow-inner ring-1 ring-black/30 transition-transform hover:scale-110"
        >
          <Minus className="m-auto h-2 w-2 opacity-0 transition-opacity group-hover:opacity-80" />
        </button>
        <button
          aria-label={isMaximized ? "Restore" : "Maximize"}
          onClick={onMaximize}
          className="group h-3.5 w-3.5 rounded-full bg-[#28C840] shadow-inner ring-1 ring-black/30 transition-transform hover:scale-110"
        >
          <Maximize2 className="m-auto h-2 w-2 opacity-0 transition-opacity group-hover:opacity-80" />
        </button>
      </div>

      <div className="ml-3 flex flex-1 items-center gap-2 truncate">
        {Icon ? (
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: `${accent}26`, color: accent }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <div className="truncate">
          <div className="truncate text-xs font-semibold text-zinc-100">{title}</div>
          {subtitle ? (
            <div className="truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}

      {focused ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent}aa 50%, transparent 100%)`,
          }}
        />
      ) : null}
    </div>
  );
}
