"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Minus,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import {
  useKpisStore,
  type KPI,
  type KpiPillar,
  type KpiUnit,
} from "@/state/kpis.store";
import { useToast } from "@/state/toast.store";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { KPIFormDialog } from "./KPIFormDialog";

type Unit = KpiUnit;
type Pillar = KpiPillar;

const PILLAR_COLOR: Record<Pillar, string> = {
  Growth: "#FBCFE8",
  Delivery: "#FDE68A",
  People: "#A7F3D0",
  Finance: "#FBBF24",
  Customer: "#C7D2FE",
};

const PILLARS: ("All" | Pillar)[] = ["All", "Growth", "Delivery", "People", "Finance", "Customer"];

function formatValue(value: number, unit: Unit): string {
  if (unit === "IDR") return formatIDRCompact(value);
  if (unit === "%") return formatPercent(value, 1);
  if (unit === "h") return `${value.toFixed(value < 100 ? 1 : 0)}h`;
  return value.toLocaleString("en-US");
}

function trendOf(kpi: KPI): "up" | "down" | "flat" {
  const a = kpi.history.slice(-6, -3).reduce((s, v) => s + v, 0) / 3;
  const b = kpi.history.slice(-3).reduce((s, v) => s + v, 0) / 3;
  if (Math.abs(b - a) / Math.max(1, Math.abs(a)) < 0.01) return "flat";
  return b > a ? "up" : "down";
}

function statusOf(kpi: KPI): "on-track" | "at-risk" | "off-track" {
  const ratio = kpi.current / kpi.target;
  if (kpi.direction === "higher") {
    if (ratio >= 1) return "on-track";
    if (ratio >= 0.9) return "at-risk";
    return "off-track";
  } else {
    if (ratio <= 1) return "on-track";
    if (ratio <= 1.1) return "at-risk";
    return "off-track";
  }
}

const STATUS_TONE: Record<"on-track" | "at-risk" | "off-track", "success" | "warning" | "danger"> = {
  "on-track": "success",
  "at-risk": "warning",
  "off-track": "danger",
};

export function KPIsView() {
  const [filter, setFilter] = useState<"All" | Pillar>("All");

  const kpis = useKpisStore((s) => s.items);
  const hydrate = useKpisStore((s) => s.hydrate);
  const addKpi = useKpisStore((s) => s.add);
  const updateKpi = useKpisStore((s) => s.update);
  const removeKpi = useKpisStore((s) => s.remove);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KPI | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KPI | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (k: KPI) => {
    setEditing(k);
    setFormOpen(true);
  };

  const filtered = useMemo(
    () => (filter === "All" ? kpis : kpis.filter((k) => k.pillar === filter)),
    [kpis, filter],
  );

  const counts = useMemo(() => {
    let on = 0;
    let at = 0;
    let off = 0;
    kpis.forEach((k) => {
      const s = statusOf(k);
      if (s === "on-track") on++;
      else if (s === "at-risk") at++;
      else off++;
    });
    return { on, at, off };
  }, [kpis]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Executive · KPIs
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            KPIs &amp; targets
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Twelve-period trend per KPI, target floor, and on-/off-track status across the five
            strategic pillars.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="press inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-zinc-100 hover:bg-white/15"
        >
          <Plus className="h-3.5 w-3.5" />
          Add KPI
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Target}
          label="KPIs tracked"
          value={String(kpis.length)}
          delta={`${PILLARS.length - 1} pillars`}
          trend="up"
        />
        <MetricCard
          icon={CheckCircle2}
          label="On track"
          value={String(counts.on)}
          trend={counts.on > kpis.length / 2 ? "up" : "flat"}
          accent="#22C55E"
        />
        <MetricCard
          icon={CircleDot}
          label="At risk"
          value={String(counts.at)}
          accent="#F59E0B"
        />
        <MetricCard
          icon={TrendingDown}
          label="Off track"
          value={String(counts.off)}
          trend={counts.off > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Target className="h-3 w-3 text-zinc-500" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Pillar</span>
        {PILLARS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
              filter === p
                ? "border-white/25 bg-white/12 text-zinc-50"
                : "border-white/10 text-zinc-400 hover:bg-white/8 hover:text-zinc-200",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Scoreboard"
          title={`KPIs (${filtered.length})`}
          description="Current vs target, with rolling 12-period sparkline."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((k) => (
            <KPICard
              key={k.id}
              kpi={k}
              onEdit={() => openEdit(k)}
              onDelete={() => setConfirmDelete(k)}
            />
          ))}
        </div>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Ownership"
          title="By pillar"
          description="Aggregated status per pillar."
        />
        <ul className="space-y-2 text-[11px]">
          {(PILLARS.filter((p) => p !== "All") as Pillar[]).map((pillar) => {
            const inPillar = kpis.filter((k) => k.pillar === pillar);
            const on = inPillar.filter((k) => statusOf(k) === "on-track").length;
            const at = inPillar.filter((k) => statusOf(k) === "at-risk").length;
            const off = inPillar.filter((k) => statusOf(k) === "off-track").length;
            const total = inPillar.length;
            return (
              <li
                key={pillar}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 px-3 py-2"
              >
                <span
                  className="col-span-2 inline-flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: PILLAR_COLOR[pillar] }}
                >
                  <span
                    className="grid h-2 w-2 rounded-full"
                    style={{ background: PILLAR_COLOR[pillar] }}
                  />
                  {pillar}
                </span>
                <div className="col-span-7 flex h-2 overflow-hidden rounded-full bg-white/8">
                  {on > 0 ? (
                    <span
                      className="bg-emerald-400/80"
                      style={{ width: `${(on / total) * 100}%` }}
                      title={`${on} on track`}
                    />
                  ) : null}
                  {at > 0 ? (
                    <span
                      className="bg-amber-400/80"
                      style={{ width: `${(at / total) * 100}%` }}
                      title={`${at} at risk`}
                    />
                  ) : null}
                  {off > 0 ? (
                    <span
                      className="bg-rose-400/80"
                      style={{ width: `${(off / total) * 100}%` }}
                      title={`${off} off track`}
                    />
                  ) : null}
                </div>
                <span className="col-span-3 text-right font-mono text-[10px] text-zinc-300">
                  {on}/{total} on track
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <KPIFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateKpi(editingId, draft);
            toast.success("KPI updated", draft.name);
          } else {
            addKpi(draft);
            toast.success("KPI created", draft.name);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Delete KPI?"
        description={
          confirmDelete
            ? `${confirmDelete.name} will be removed from the scoreboard. You can re-create it later.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = confirmDelete.name;
          removeKpi(confirmDelete.id);
          setConfirmDelete(null);
          toast.info("KPI deleted", name);
        }}
      />
    </div>
  );
}

function KPICard({
  kpi,
  onEdit,
  onDelete,
}: {
  kpi: KPI;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = statusOf(kpi);
  const trend = trendOf(kpi);
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const isGoodTrend =
    (kpi.direction === "higher" && trend === "up") ||
    (kpi.direction === "lower" && trend === "down");

  const series = kpi.history.map((y, i) => ({ x: i, y }));
  const lineColor = PILLAR_COLOR[kpi.pillar];
  const gap = kpi.direction === "higher" ? kpi.current - kpi.target : kpi.target - kpi.current;
  const gapPct = kpi.target !== 0 ? (gap / Math.abs(kpi.target)) * 100 : 0;

  return (
    <article className="group glass-soft flex flex-col gap-3 rounded-2xl border border-white/8 p-4 transition-all hover:-translate-y-0.5 hover:border-white/20">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="grid h-2 w-2 rounded-full"
              style={{ background: lineColor }}
            />
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: lineColor }}
            >
              {kpi.pillar}
            </span>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-zinc-50">{kpi.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${kpi.name}`}
              title="Edit"
              className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${kpi.name}`}
              title="Delete"
              className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <StatusBadge tone={STATUS_TONE[status]} dot>
            {status.replace("-", " ")}
          </StatusBadge>
        </div>
      </header>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="font-mono text-2xl font-semibold tracking-tight text-zinc-50">
            {formatValue(kpi.current, kpi.unit)}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">
            Target {kpi.direction === "higher" ? "≥" : "≤"} {formatValue(kpi.target, kpi.unit)}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-mono",
            isGoodTrend
              ? "bg-emerald-500/15 text-emerald-300"
              : trend === "flat"
                ? "bg-white/8 text-zinc-300"
                : "bg-rose-500/15 text-rose-300",
          )}
          title={`${gapPct >= 0 ? "+" : ""}${gapPct.toFixed(1)}% vs target`}
        >
          <TrendIcon className="h-3 w-3" />
          {gapPct >= 0 ? "+" : ""}
          {gapPct.toFixed(0)}%
        </span>
      </div>

      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.45} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "rgba(20, 21, 27, 0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 10,
                padding: "4px 8px",
                color: "#fafafa",
              }}
              formatter={(v) => formatValue(Number(v ?? 0), kpi.unit)}
              labelFormatter={() => ""}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke={lineColor}
              strokeWidth={1.5}
              fill={`url(#grad-${kpi.id})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <footer className="flex items-center justify-between text-[10px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : trend === "down" ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          {kpi.owner}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-2.5 w-2.5" />
          {kpi.cadence}
        </span>
      </footer>
    </article>
  );
}
