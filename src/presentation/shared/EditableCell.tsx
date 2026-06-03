"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatIDR, formatIDRCompact } from "@/lib/currency";

export type EditableCellType =
  | "text"
  | "number"
  | "currency"
  | "currencyCompact"
  | "percent"
  | "date"
  | "select";

interface EditableCellProps {
  value: unknown;
  type: EditableCellType;
  onSave: (next: unknown) => void;
  options?: string[];
  /** Tailwind classes applied to both display + input states. */
  className?: string;
  /** Forces alignment of the value text (default depends on type). */
  align?: "left" | "right";
  placeholder?: string;
  /** Visual treatment for the display value (e.g. tone). */
  displayClassName?: string;
  /** Custom display-mode renderer (e.g. a colored status badge). When set, it
   *  replaces the formatted-text span in display mode; the cell still becomes an
   *  editor on click. */
  displayRender?: (value: unknown) => React.ReactNode;
}

/**
 * Single-cell inline editor. Click to edit, Enter / blur to save, Escape to
 * cancel. Renders a typed input in edit mode; in display mode it shows the
 * formatted value with a faint editable affordance on hover.
 */
export function EditableCell({
  value,
  type,
  onSave,
  options,
  className,
  align,
  placeholder,
  displayClassName,
  displayRender,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(() => stringify(value, type));
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!editing) setDraft(stringify(value, type));
  }, [value, type, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select?.();
      }
    }
  }, [editing]);

  const commit = () => {
    const parsed = parse(draft, type);
    if (parsed === undefined) {
      setEditing(false);
      return;
    }
    if (parsed !== value) onSave(parsed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(stringify(value, type));
    setEditing(false);
  };

  const isRight = align === "right" || (align == null && (type === "number" || type === "currency" || type === "currencyCompact" || type === "percent"));

  if (editing) {
    if (type === "select") {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className={cn(
            "w-full rounded-md border border-white/20 bg-white/[0.05] px-2 py-1 text-xs text-zinc-100 focus:border-white/40 focus:outline-none",
            className,
          )}
        >
          <option value="" disabled>
            {placeholder ?? "—"}
          </option>
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === "date" ? "date" : type === "text" ? "text" : "number"}
        step={type === "percent" ? "0.1" : type === "number" || type === "currency" || type === "currencyCompact" ? "1" : undefined}
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-white/20 bg-white/[0.05] px-2 py-1 text-xs text-zinc-100 focus:border-white/40 focus:outline-none",
          isRight && "text-right font-mono",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        "group inline-flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none",
        isRight && "justify-end text-right",
        className,
      )}
    >
      {displayRender ? (
        displayRender(value)
      ) : (
        <span className={cn(displayClassName)}>{format(value, type) || (placeholder && <span className="text-zinc-500">{placeholder}</span>) || <span className="text-zinc-500">—</span>}</span>
      )}
      <span className="ml-1 text-[8px] text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
        ✎
      </span>
    </button>
  );
}

function stringify(value: unknown, type: EditableCellType): string {
  if (value == null) return "";
  if (type === "date") {
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  if (type === "number" || type === "currency" || type === "currencyCompact" || type === "percent") {
    return Number.isFinite(Number(value)) ? String(value) : "";
  }
  return String(value);
}

function parse(draft: string, type: EditableCellType): unknown {
  if (type === "number" || type === "currency" || type === "currencyCompact" || type === "percent") {
    const trimmed = draft.trim().replace(/[^0-9.\-]/g, "");
    if (trimmed === "") return 0;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return undefined;
    return n;
  }
  if (type === "date") {
    return draft.trim() || undefined;
  }
  return draft;
}

function format(value: unknown, type: EditableCellType): string {
  if (value == null || value === "") return "";
  if (type === "currency") return formatIDR(Number(value));
  if (type === "currencyCompact") return formatIDRCompact(Number(value));
  if (type === "percent") {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return `${n}%`;
  }
  if (type === "number") {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return n.toLocaleString("en-US");
  }
  return String(value);
}
