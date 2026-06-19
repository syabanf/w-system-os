"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Search,
  Briefcase,
  Package,
  Wrench,
  Repeat,
  UserCheck,
  Users,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface ClientPortalCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Order matches the PDF mockup.
const CATEGORIES: ClientPortalCategory[] = [
  { id: "project-based", label: "Project Based", icon: Briefcase },
  { id: "product-based", label: "Product Based", icon: Package },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "subscribe", label: "Subscribe", icon: Repeat },
  { id: "consultant", label: "Consultant", icon: UserCheck },
  { id: "leads", label: "Leads", icon: Users },
  { id: "pre-deal", label: "Pre-Deal", icon: Handshake },
];

interface ClientPortalMegaMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (categoryId: string) => void;
  /** Element to anchor / detect outside-clicks against (the trigger). */
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function ClientPortalMegaMenu({
  open,
  onClose,
  onSelect,
  anchorRef,
}: ClientPortalMegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  // Esc to close + outside-click to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, anchorRef]);

  // Reset query each time the panel opens.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.2, 0.9, 0.25, 1.0] }}
          className="menu-surface absolute left-0 top-full z-50 mt-1 w-[280px] overflow-hidden rounded-xl border border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
          role="menu"
          aria-label="Client Portal categories"
        >
          <div className="border-b border-white/8 p-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[11px] text-zinc-300 focus-within:border-white/25">
              <Search className="h-3 w-3 text-zinc-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for ..."
                className="w-full bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
              />
            </label>
          </div>
          <ul className="p-1.5">
            {filtered.length === 0 ? (
              <li className="px-2.5 py-2 text-[11px] text-zinc-400">No matches</li>
            ) : (
              filtered.map((cat) => {
                const Icon = cat.icon;
                return (
                  <li key={cat.id}>
                    <button
                      role="menuitem"
                      onClick={() => {
                        onSelect(cat.id);
                        onClose();
                      }}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 transition-colors",
                        "hover:bg-white/[0.06] hover:text-zinc-50",
                      )}
                    >
                      <ChevronRight className="h-3 w-3 text-zinc-400 transition-colors group-hover:text-zinc-200" />
                      <span className="flex-1 truncate">{cat.label}</span>
                      <Icon className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-zinc-200" />
                      <ChevronRight className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-zinc-300" />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
