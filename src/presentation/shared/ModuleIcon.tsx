"use client";

import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import { type AppModule, type AppModuleId } from "@/constants/appModules";
import { resolveModuleIcon } from "@/constants/iconSets";
import { useIconSetStore } from "@/state/iconSet.store";

/** Renders a module's glyph under the active icon set. Centralised so call
 *  sites don't bind a component from a call during render — which the
 *  react-hooks/static-components rule forbids — and so the whole app swaps
 *  icon sets from one place. Extra props (className, strokeWidth, style…) pass
 *  straight through to the lucide glyph. */
export function ModuleIcon({
  module,
  ...props
}: { module: AppModule | AppModuleId } & LucideProps) {
  const setId = useIconSetStore((s) => s.id);
  const glyph = resolveModuleIcon(
    setId,
    typeof module === "string" ? module : module.id,
  );
  return createElement(glyph, props);
}
