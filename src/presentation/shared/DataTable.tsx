"use client";

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
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  onRowClick,
  dense,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
        {empty ?? "No records."}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/8", className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03]">
          <tr>
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
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-t border-white/5 transition-colors",
                "hover:bg-white/[0.04]",
                onRowClick && "cursor-pointer",
                i % 2 === 1 && "bg-white/[0.015]",
              )}
            >
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
