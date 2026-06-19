"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Reveal the search box once the list grows past this many options. */
  searchThreshold?: number;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

const TRIGGER_CLS =
  "flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-xs text-zinc-100 outline-none transition-colors hover:border-white/20 focus:border-white/30 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";

interface Placement {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxH: number;
}

/**
 * The app's default dropdown: a searchable combobox that mirrors the native
 * `<select>` API (value / onChange(value) / options), so swapping a `<select>`
 * is mechanical. The search box appears only once the list is long enough to
 * need it. The list is rendered in a portal (fixed-positioned, flips up near
 * the viewport edge) so it's never clipped by an `overflow-hidden` dialog, and
 * it uses the opaque `menu-surface` so nothing bleeds through.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  searchThreshold = 7,
  ariaLabel,
  id,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);
  const showSearch = options.length > searchThreshold;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Position the portaled list under (or above) the trigger, matching its
  // width, and keep it pinned on scroll/resize.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const desired = 280;
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const openUp = spaceBelow < desired && spaceAbove > spaceBelow;
      const maxH = Math.max(
        140,
        Math.min(desired, (openUp ? spaceAbove : spaceBelow) - 12),
      );
      setPos(
        openUp
          ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxH }
          : { left: r.left, width: r.width, top: r.bottom + 4, maxH },
      );
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // Close on outside click (account for the portaled list living outside root).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // On open: clear query, highlight the current value, focus the search.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    if (showSearch) {
      const raf = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open, options, value, showSearch]);

  const choose = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) choose(opt);
    }
  };

  const list =
    open && pos && mounted
      ? createPortal(
          <div
            ref={listRef}
            role="listbox"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              width: pos.width,
              zIndex: 60,
            }}
            className="menu-surface overflow-hidden rounded-lg border border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
          >
            {showSearch ? (
              <div className="flex items-center gap-1.5 border-b border-white/8 px-2.5 py-1.5">
                <Search className="h-3 w-3 shrink-0 text-zinc-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search…"
                  className="w-full bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </div>
            ) : null}
            <ul style={{ maxHeight: pos.maxH }} className="overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-center text-[11px] text-zinc-500">
                  No matches
                </li>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = opt.value === value;
                  const isActive = i === active;
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(opt)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                          opt.disabled
                            ? "cursor-not-allowed text-zinc-500"
                            : "text-zinc-200",
                          isActive && !opt.disabled && "bg-white/8",
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={TRIGGER_CLS}
      >
        <span className={cn("truncate", !selected && "text-zinc-500")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      </button>
      {list}
    </div>
  );
}
