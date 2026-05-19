"use client";

import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  initials?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({ name, initials, color = "#A1A1AA", size = "md", className }: AvatarProps) {
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
        "grid shrink-0 place-items-center rounded-full font-semibold text-white shadow-inner",
        SIZE[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.4) 120%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px -3px ${color}66`,
      }}
      title={name}
    >
      {fallback}
    </span>
  );
}
