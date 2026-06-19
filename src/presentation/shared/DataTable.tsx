"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  className?: string;
  /** Enable a leading checkbox column for bulk selection. */
  selectable?: boolean;
  /** Ids currently selected (controlled). Pair with the useRowSelection hook. */
  selectedIds?: Set<string>;
  /** Toggle a single row. Receives the row's key. */
  onToggleRow?: (id: string) => void;
  /** Toggle all currently-rendered rows. Receives the visible row keys. */
  onToggleAll?: (visibleIds: string[]) => void;
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-3.5 w-3.5 cursor-pointer rounded border-white/25 bg-white/5 accent-blue-500"
    />
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  onRowClick,
  dense,
  className,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
        {empty ?? "Nothing here yet."}
      </div>
    );
  }

  const showSelect = !!selectable && !!selectedIds && !!onToggleRow;
  const visibleIds = showSelect ? rows.map(rowKey) : [];
  const allOn = showSelect && visibleIds.length > 0 && visibleIds.every((id) => selectedIds!.has(id));
  const someOn = showSelect && visibleIds.some((id) => selectedIds!.has(id));

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/8", className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03]">
          <tr>
            {showSelect ? (
              <th className="w-10 px-4 py-3" style={{ width: "2.5rem" }}>
                <Checkbox
                  ariaLabel="Select all rows"
                  checked={allOn}
                  indeterminate={someOn}
                  onChange={() => onToggleAll?.(visibleIds)}
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const id = rowKey(row);
            const selected = showSelect && selectedIds!.has(id);
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-t border-white/5 transition-colors",
                  "hover:bg-white/[0.04]",
                  onRowClick && "cursor-pointer",
                  i % 2 === 1 && "bg-white/[0.015]",
                  selected && "bg-blue-500/10 hover:bg-blue-500/15",
                )}
              >
                {showSelect ? (
                  <td className="px-4" style={{ width: "2.5rem" }}>
                    <Checkbox
                      ariaLabel="Select row"
                      checked={!!selected}
                      onChange={() => onToggleRow?.(id)}
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 text-zinc-200",
                      dense ? "py-2 text-xs" : "py-3",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
