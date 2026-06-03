"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Target, X } from "lucide-react";
import type {
  KPI,
  KpiCadence,
  KpiDirection,
  KpiDraft,
  KpiPillar,
  KpiUnit,
} from "@/state/kpis.store";
import { cn } from "@/lib/cn";

const PILLARS: KpiPillar[] = ["Growth", "Delivery", "People", "Finance", "Customer"];
const UNITS: KpiUnit[] = ["IDR", "%", "h", "count"];
const DIRECTIONS: { value: KpiDirection; label: string }[] = [
  { value: "higher", label: "Higher is better" },
  { value: "lower", label: "Lower is better" },
];
const CADENCES: KpiCadence[] = ["Daily", "Weekly", "Monthly", "Quarterly"];

interface Draft {
  name: string;
  pillar: KpiPillar;
  unit: KpiUnit;
  current: string;
  target: string;
  direction: KpiDirection;
  owner: string;
  cadence: KpiCadence;
}

function emptyDraft(): Draft {
  return {
    name: "",
    pillar: "Growth",
    unit: "%",
    current: "",
    target: "",
    direction: "higher",
    owner: "",
    cadence: "Monthly",
  };
}

function fromKpi(k: KPI): Draft {
  return {
    name: k.name,
    pillar: k.pillar,
    unit: k.unit,
    current: String(k.current),
    target: String(k.target),
    direction: k.direction,
    owner: k.owner,
    cadence: k.cadence,
  };
}

interface Props {
  open: boolean;
  editing?: KPI | null;
  onClose: () => void;
  onSubmit: (draft: KpiDraft, editingId?: string) => void;
}

export function KPIFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromKpi(editing) : emptyDraft());
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const current = Number(draft.current);
  const target = Number(draft.target);
  const isValid =
    draft.name.trim().length > 0 &&
    draft.owner.trim().length > 0 &&
    Number.isFinite(current) &&
    draft.current.trim() !== "" &&
    Number.isFinite(target) &&
    draft.target.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    // Preserve the historical series when editing; seed a flat 12-period series
    // anchored on `current` for brand-new KPIs so the sparkline renders.
    const history =
      editing && editing.history.length > 0
        ? editing.history
        : Array.from({ length: 12 }, () => current);
    onSubmit(
      {
        name: draft.name.trim(),
        pillar: draft.pillar,
        unit: draft.unit,
        current,
        target,
        direction: draft.direction,
        owner: draft.owner.trim(),
        cadence: draft.cadence,
        history,
      },
      editing?.id,
    );
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
            className="glass-strong w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-zinc-100">
                <Target className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit KPI" : "Create KPI"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.name : "New KPI"}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                title="Close (Esc)"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <Field label="Name" required>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Monthly Revenue"
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pillar">
                  <select
                    value={draft.pillar}
                    onChange={(e) => set("pillar", e.target.value as KpiPillar)}
                    className={inputCls}
                  >
                    {PILLARS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Unit">
                  <select
                    value={draft.unit}
                    onChange={(e) => set("unit", e.target.value as KpiUnit)}
                    className={inputCls}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Current" required>
                  <input
                    type="number"
                    step="any"
                    value={draft.current}
                    onChange={(e) => set("current", e.target.value)}
                    className={cn(inputCls, "font-mono")}
                    placeholder="0"
                  />
                </Field>
                <Field label="Target" required>
                  <input
                    type="number"
                    step="any"
                    value={draft.target}
                    onChange={(e) => set("target", e.target.value)}
                    className={cn(inputCls, "font-mono")}
                    placeholder="0"
                  />
                </Field>
                <Field label="Direction">
                  <select
                    value={draft.direction}
                    onChange={(e) =>
                      set("direction", e.target.value as KpiDirection)
                    }
                    className={inputCls}
                  >
                    {DIRECTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Cadence">
                  <select
                    value={draft.cadence}
                    onChange={(e) => set("cadence", e.target.value as KpiCadence)}
                    className={inputCls}
                  >
                    {CADENCES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Owner" required>
                <input
                  type="text"
                  value={draft.owner}
                  onChange={(e) => set("owner", e.target.value)}
                  className={inputCls}
                  placeholder="Accountable person"
                />
              </Field>

              <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
                <span className="mr-auto text-[9px] uppercase tracking-wider text-zinc-500">
                  Esc to close · Enter to save
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors",
                    isValid
                      ? "bg-white/85 text-zinc-900 hover:bg-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {editing ? "Save changes" : "Create KPI"}
                </button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-white/30 focus:bg-white/[0.06]";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> ·</span> : null}
      </span>
      {children}
    </label>
  );
}
