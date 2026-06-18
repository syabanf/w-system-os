"use client";

import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  initials?: string;
  color?: string;
  /** Optional photo (data URL or src). Rendered as a cover background; falls
   *  back to the gradient + initials tile when absent. */
  image?: string;
  /** When set, a presence dot in this color is drawn at the bottom-right. */
  statusColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

const DOT: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-2 w-2 ring-[1.5px]",
  md: "h-2.5 w-2.5 ring-2",
  lg: "h-3.5 w-3.5 ring-2",
};

export function Avatar({
  name,
  initials,
  color = "#A1A1AA",
  image,
  statusColor,
  size = "md",
  className,
}: AvatarProps) {
  const fallback =
    initials ??
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full font-semibold text-white shadow-inner",
        SIZE[size],
        className,
      )}
      style={{
        ...(image
          ? {
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.4) 120%)`,
            }),
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px -3px ${color}66`,
      }}
      title={name}
    >
      {image ? null : fallback}
      {statusColor ? (
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-0 -right-0 rounded-full ring-zinc-950",
            DOT[size],
          )}
          style={{ background: statusColor }}
        />
      ) : null}
    </span>
  );
}
