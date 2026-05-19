"use client";

import { useMemo, useState } from "react";
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
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";

type Unit = "IDR" | "%" | "h" | "count";
type Pillar = "Growth" | "Delivery" | "People" | "Finance" | "Customer";
type Direction = "higher" | "lower";

interface KPI {
  id: string;
  name: string;
  pillar: Pillar;
  unit: Unit;
  current: number;
  target: number;
  /** "higher" → current ≥ target is good. "lower" → current ≤ target is good. */
  direction: Direction;
  /** Last 12 periods, oldest → newest. */
  history: number[];
  owner: string;
  cadence: "Daily" | "Weekly" | "Monthly" | "Quarterly";
}

const KPIS: KPI[] = [
  {
    id: "kpi-001",
    name: "Monthly Revenue",
    pillar: "Finance",
    unit: "IDR",
    current: 2_180_000_000,
    target: 2_000_000_000,
    direction: "higher",
    history: [1_650, 1_720, 1_810, 1_890, 1_780, 1_920, 2_010, 1_950, 2_040, 2_120, 2_080, 2_180].map((n) => n * 1_000_000),
    owner: "Damar Wicaksono",
    cadence: "Monthly",
  },
  {
    id: "kpi-002",
    name: "Gross Margin",
    pillar: "Finance",
    unit: "%",
    current: 38,
    target: 35,
    direction: "higher",
    history: [29, 31, 30, 33, 34, 32, 36, 35, 37, 36, 39, 38],
    owner: "Hana Wijaya",
    cadence: "Monthly",
  },
  {
    id: "kpi-003",
    name: "Sales Win Rate",
    pillar: "Growth",
    unit: "%",
    current: 67,
    target: 60,
    direction: "higher",
    history: [52, 55, 58, 56, 60, 61, 59, 63, 62, 65, 66, 67],
    owner: "Citra Anggraini",
    cadence: "Monthly",
  },
  {
    id: "kpi-004",
    name: "Pipeline Coverage",
    pillar: "Growth",
    unit: "count",
    current: 3,
    target: 3,
    direction: "higher",
    history: [2.1, 2.4, 2.6, 2.5, 2.8, 2.9, 2.7, 3.1, 3.0, 3.2, 3.1, 3.0],
    owner: "Citra Anggraini",
    cadence: "Weekly",
  },
  {
    id: "kpi-005",
    name: "Utilization Rate",
    pillar: "Delivery",
    unit: "%",
    current: 85.6,
    target: 80,
    direction: "higher",
    history: [76, 78, 81, 79, 82, 84, 83, 85, 86, 84, 85, 85.6],
    owner: "Bagas Adhitya",
    cadence: "Weekly",
  },
  {
    id: "kpi-006",
    name: "Sprint Velocity",
    pillar: "Delivery",
    unit: "count",
    current: 58,
    target: 55,
    direction: "higher",
    history: [42, 48, 51, 54, 52, 56, 53, 57, 55, 60, 59, 58],
    owner: "Damar Wicaksono",
    cadence: "Monthly",
  },
  {
    id: "kpi-007",
    name: "Avg SLA Resolution",
    pillar: "Customer",
    unit: "h",
    current: 14.6,
    target: 16,
    direction: "lower",
    history: [22, 21, 19, 20, 18, 19, 17, 18, 16, 15, 15.5, 14.6],
    owner: "Aulia Kurniawan",
    cadence: "Weekly",
  },
  {
    id: "kpi-008",
    name: "CSAT",
    pillar: "Customer",
    unit: "%",
    current: 88,
    target: 85,
    direction: "higher",
    history: [80, 82, 81, 83, 84, 82, 85, 86, 84, 87, 88, 88],
    owner: "Aulia Kurniawan",
    cadence: "Monthly",
  },
  {
    id: "kpi-009",
    name: "Outstanding Invoices",
    pillar: "Finance",
    unit: "count",
    current: 6,
    target: 5,
    direction: "lower",
    history: [12, 11, 10, 9, 10, 8, 9, 7, 8, 6, 7, 6],
    owner: "Hana Wijaya",
    cadence: "Weekly",
  },
  {
    id: "kpi-010",
    name: "Attrition Rate",
    pillar: "People",
    unit: "%",
    current: 4.2,
    target: 5,
    direction: "lower",
    history: [6.0, 5.8, 5.5, 5.6, 5.2, 5.0, 5.1, 4.8, 4.5, 4.6, 4.3, 4.2],
    owner: "Sekar Wulandari",
    cadence: "Quarterly",
  },
  {
    id: "kpi-011",
    name: "Time to Hire",
    pillar: "People",
    unit: "h",
    current: 312,
    target: 360,
    direction: "lower",
    history: [420, 410, 395, 380, 388, 365, 372, 350, 355, 330, 318, 312],
    owner: "Sekar Wulandari",
    cadence: "Quarterly",
  },
  {
    id: "kpi-012",
    name: "Project On-Time %",
    pillar: "Delivery",
    unit: "%",
    current: 78,
    target: 80,
    direction: "higher",
    history: [70, 72, 71, 74, 75, 73, 76, 75, 77, 79, 76, 78],
    owner: "Indra Setiawan",
    cadence: "Monthly",
  },
];

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

  const filtered = useMemo(
    () => (filter === "All" ? KPIS : KPIS.filter((k) => k.pillar === filter)),
    [filter],
  );

  const counts = useMemo(() => {
    let on = 0;
    let at = 0;
    let off = 0;
    KPIS.forEach((k) => {
      const s = statusOf(k);
      if (s === "on-track") on++;
      else if (s === "at-risk") at++;
      else off++;
    });
    return { on, at, off };
  }, []);

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
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Target}
          label="KPIs tracked"
          value={String(KPIS.length)}
          delta={`${PILLARS.length - 1} pillars`}
          trend="up"
        />
        <MetricCard
          icon={CheckCircle2}
          label="On track"
          value={String(counts.on)}
          trend={counts.on > KPIS.length / 2 ? "up" : "flat"}
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
            <KPICard key={k.id} kpi={k} />
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
            const inPillar = KPIS.filter((k) => k.pillar === pillar);
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
    </div>
  );
}

function KPICard({ kpi }: { kpi: KPI }) {
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
    <article className="glass-soft flex flex-col gap-3 rounded-2xl border border-white/8 p-4 transition-all hover:-translate-y-0.5 hover:border-white/20">
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
        <StatusBadge tone={STATUS_TONE[status]} dot>
          {status.replace("-", " ")}
        </StatusBadge>
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
