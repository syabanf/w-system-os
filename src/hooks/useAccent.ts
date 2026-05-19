"use client";

import type { AppModule } from "@/constants/appModules";
import { useThemeStore } from "@/state/theme.store";

/**
 * Picks the appropriate accent color for the current theme.
 * Dark mode uses the pastel `accent`; light mode uses the saturated
 * `accentLight` counterpart so icons remain legible on light tiles.
 */
export function useAccent(module: AppModule): string {
  const theme = useThemeStore((s) => s.theme);
  return theme === "light" ? module.accentLight : module.accent;
}
