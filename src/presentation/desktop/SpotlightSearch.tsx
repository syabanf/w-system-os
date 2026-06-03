"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { useSpotlightStore } from "@/state/spotlight.store";
import { useWindowStore } from "@/state/window.store";
import {
  useSpotlightSearch,
  type SpotlightResult,
  type SpotlightResultCategory,
} from "@/hooks/useSpotlightSearch";
import type { AppModuleId } from "@/constants/appModules";
import { cn } from "@/lib/cn";

const CATEGORY_TONE: Record<SpotlightResultCategory, string> = {
  App: "text-zinc-100",
  Project: "text-sky-300",
  Client: "text-emerald-300",
  Invoice: "text-amber-300",
  Team: "text-fuchsia-300",
  Task: "text-cyan-300",
  Lead: "text-pink-300",
  Ticket: "text-orange-300",
  Employee: "text-violet-300",
  KPI: "text-lime-300",
};

export function SpotlightSearch() {
  const isOpen = useSpotlightStore((s) => s.isOpen);
  const query = useSpotlightStore((s) => s.query);
  const setQuery = useSpotlightStore((s) => s.setQuery);
  const close = useSpotlightStore((s) => s.close);
  const toggle = useSpotlightStore((s) => s.toggle);
  const openApp = useWindowStore((s) => s.openApp);
  const results = useSpotlightSearch(query);

  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the active index in range as results change (e.g. while typing).
  useEffect(() => {
    setActive((a) => (results.length === 0 ? 0 : Math.min(a, results.length - 1)));
  }, [results.length]);

  // Reset to the top whenever the query text changes.
  useEffect(() => {
    setActive(0);
  }, [query]);

  const select = (r: SpotlightResult | undefined) => {
    if (!r) return;
    if (r.appId) openApp(r.appId as AppModuleId);
    close();
  };

  // Scroll the active row into view as it moves.
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, isOpen]);

  // Global ⌘K / Ctrl-K only needs to OPEN the palette (the input isn't mounted
  // while closed). Escape / arrows / Enter are handled on the focused input
  // below, so they don't compete with other global key handlers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const len = results.length;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (len) setActive((a) => (a + 1) % len);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (len) setActive((a) => (a - 1 + len) % len);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[active]);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-md"
      onClick={close}
    >
      <motion.div
        initial={{ y: -8, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]"
      >
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search projects, clients, invoices, people, tasks…"
                className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none"
              />
              <kbd className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-zinc-400">ESC</kbd>
            </div>
            <div className="glass-scroll max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-400">
                  No matches for “{query}”.
                </div>
              ) : (
                <ul ref={listRef} className="space-y-0.5">
                  {results.map((r, i) => (
                    <li key={r.id}>
                      <button
                        data-idx={i}
                        onClick={() => select(r)}
                        onMouseMove={() => setActive(i)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                          i === active ? "bg-white/10" : "hover:bg-white/8",
                        )}
                      >
                        <span
                          className={cn(
                            "rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            CATEGORY_TONE[r.category],
                          )}
                        >
                          {r.category}
                        </span>
                        <span className="flex-1 truncate">
                          <span className="block truncate text-sm text-zinc-100">{r.title}</span>
                          <span className="block truncate text-[11px] text-zinc-400">
                            {r.subtitle}
                          </span>
                        </span>
                        <ArrowRight
                          className={cn(
                            "h-3.5 w-3.5 text-zinc-500 transition-opacity",
                            i === active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                          )}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/8 px-4 py-2 text-[10px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-zinc-100" />
                WIT spotlight — global search across the OS
              </span>
              <span className="font-mono">↩ open · ↑↓ navigate</span>
            </div>
      </motion.div>
    </motion.div>
  );
}
