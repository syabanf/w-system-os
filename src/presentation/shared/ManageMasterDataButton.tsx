"use client";

import { Database } from "lucide-react";
import type { AppModuleId } from "@/constants/appModules";
import { useMasterDataStore } from "@/state/masterData.store";

interface ManageMasterDataButtonProps {
  moduleId: AppModuleId;
  label?: string;
  className?: string;
}

/**
 * Compact pill that lives inside a module view header. Opens the global
 * MasterDataDrawer pre-filtered to the module's lookup categories.
 */
export function ManageMasterDataButton({
  moduleId,
  label = "Master data",
  className,
}: ManageMasterDataButtonProps) {
  const openDrawer = useMasterDataStore((s) => s.openDrawer);
  return (
    <button
      onClick={() => openDrawer(moduleId)}
      className={
        className ??
        "glass-soft inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
      }
      title="Manage reference data for this module"
    >
      <Database className="h-3 w-3 text-zinc-300" />
      {label}
    </button>
  );
}
