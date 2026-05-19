"use client";

import { Sparkles } from "lucide-react";

export function DesktopWelcome() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center">
      <div className="glass-soft pointer-events-auto rounded-3xl border border-white/8 px-8 py-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-zinc-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold text-zinc-50">Welcome to WIT ERP OS</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          Tap any app on the dock — or press ⌘K — to get started.
        </div>
      </div>
    </div>
  );
}
