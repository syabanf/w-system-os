"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardPaste, Upload, X } from "lucide-react";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { cn } from "@/lib/cn";

export interface ImportFieldDef {
  /** Logical key on the produced row, e.g. "totalValue". */
  key: string;
  /** Display label used in the column-mapping selector. */
  label: string;
  /** Hint examples shown next to the field. */
  example?: string;
  /** "string" / "number" / "currency" — informs parsing. */
  type?: "string" | "number" | "currency";
  required?: boolean;
}

interface BulkImportDialogProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: ImportFieldDef[];
  /** Builds the final row out of mapped column values. */
  buildRow: (mapped: Record<string, unknown>) => T;
  /** Called when the user clicks "Ingest" — receives the parsed rows. */
  onIngest: (rows: T[]) => void;
  /** Optional sample row text shown above the textarea. */
  sample?: string;
}

const AUTO = "__auto__";
const SKIP = "__skip__";

/**
 * Paste a CSV / TSV / spreadsheet selection → preview parsed rows → map columns
 * to fields → ingest. Auto-detects tab or comma delimiter and treats the first
 * row as the header.
 */
export function BulkImportDialog<T>({
  open,
  onClose,
  title,
  description,
  fields,
  buildRow,
  onIngest,
  sample,
}: BulkImportDialogProps<T>) {
  const [raw, setRaw] = useState<string>("");
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const { headers, rows, delimiter } = useMemo(() => parseInput(raw), [raw]);

  // Auto-map by best-effort matching header labels to field keys/labels.
  const resolvedMapping = useMemo(() => {
    const m: Record<string, string> = {};
    fields.forEach((f) => {
      const userPick = mapping[f.key];
      if (userPick != null) {
        m[f.key] = userPick;
        return;
      }
      const idx = headers.findIndex((h) => bestMatch(h, f));
      m[f.key] = idx >= 0 ? headers[idx] : SKIP;
    });
    return m;
  }, [fields, headers, mapping]);

  const preview = useMemo(() => {
    return rows.slice(0, 5).map((row) => buildPreviewRow(row, headers, resolvedMapping, fields));
  }, [rows, headers, resolvedMapping, fields]);

  const ingest = () => {
    const parsedRows = rows.map((row) =>
      buildRow(buildPreviewRow(row, headers, resolvedMapping, fields)),
    );
    onIngest(parsedRows);
    setRaw("");
    setMapping({});
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[8vh] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/8 text-zinc-200">
                <Upload className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  Bulk import
                </div>
                <div className="text-sm font-semibold text-zinc-50">{title}</div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              {description ? (
                <p className="text-[11px] leading-relaxed text-zinc-400">{description}</p>
              ) : null}

              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardPaste className="h-3 w-3" />
                    Paste rows (tab- or comma-separated). First row is treated as header.
                  </span>
                  {rows.length > 0 ? (
                    <span className="text-zinc-300">
                      Detected {rows.length} rows · delimiter {delimiter === "\t" ? "TAB" : delimiter}
                    </span>
                  ) : null}
                </div>
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={sample ?? "Paste content from a spreadsheet…"}
                  className="glass-scroll h-36 w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
                />
              </div>

              {headers.length > 0 ? (
                <>
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-400">
                      Column mapping
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {fields.map((f) => (
                        <label key={f.key} className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                            {f.label}
                            {f.required ? <span className="ml-1 text-rose-300">*</span> : null}
                            {f.example ? (
                              <span className="ml-2 normal-case text-zinc-500">e.g. {f.example}</span>
                            ) : null}
                          </span>
                          <SearchableSelect
                            value={resolvedMapping[f.key] ?? AUTO}
                            onChange={(v) =>
                              setMapping((m) => ({ ...m, [f.key]: v }))
                            }
                            options={[
                              { value: SKIP, label: "— skip —" },
                              ...headers.map((h) => ({ value: h, label: h })),
                            ]}
                            ariaLabel={f.label}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-400">
                      Preview · first {preview.length} of {rows.length}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-white/8">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-white/[0.04]">
                          <tr>
                            {fields.map((f) => (
                              <th
                                key={f.key}
                                className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-400"
                              >
                                {f.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr
                              key={i}
                              className={cn(
                                "border-t border-white/5",
                                i % 2 === 1 && "bg-white/[0.015]",
                              )}
                            >
                              {fields.map((f) => (
                                <td key={f.key} className="px-2 py-1 text-zinc-200">
                                  {String(row[f.key] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-3">
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={ingest}
                disabled={rows.length === 0}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-50",
                  rows.length === 0
                    ? "bg-white/[0.05] text-zinc-500"
                    : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30",
                )}
              >
                Ingest {rows.length > 0 ? `${rows.length} rows` : ""}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function parseInput(raw: string): {
  headers: string[];
  rows: string[][];
  delimiter: string;
} {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return { headers: [], rows: [], delimiter: "," };
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], delimiter: "," };

  const tabCount = (lines[0].match(/\t/g) ?? []).length;
  const commaCount = (lines[0].match(/,/g) ?? []).length;
  const delimiter = tabCount >= commaCount && tabCount > 0 ? "\t" : ",";

  const split = (l: string) => l.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split);
  return { headers, rows, delimiter };
}

function bestMatch(header: string, field: ImportFieldDef): boolean {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidates = [field.key, field.label, ...(field.label.split(/\s+/) ?? [])]
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  return candidates.some((c) => c && (h === c || h.includes(c) || c.includes(h)));
}

function buildPreviewRow(
  row: string[],
  headers: string[],
  resolvedMapping: Record<string, string>,
  fields: ImportFieldDef[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  fields.forEach((f) => {
    const headerName = resolvedMapping[f.key];
    if (!headerName || headerName === SKIP) {
      out[f.key] = f.type === "number" || f.type === "currency" ? 0 : "";
      return;
    }
    const idx = headers.indexOf(headerName);
    if (idx < 0) {
      out[f.key] = f.type === "number" || f.type === "currency" ? 0 : "";
      return;
    }
    const raw = row[idx] ?? "";
    if (f.type === "number" || f.type === "currency") {
      const cleaned = raw.replace(/[^0-9\-.]/g, "");
      out[f.key] = cleaned ? Number(cleaned) : 0;
    } else {
      out[f.key] = raw;
    }
  });
  return out;
}
