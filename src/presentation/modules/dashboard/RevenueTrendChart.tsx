"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint } from "@/infrastructure/data/analytics.mock";
import { formatIDRCompact } from "@/lib/currency";

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAFAF9" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#FAFAF9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          stroke="#A1A1AA"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(v) => formatIDRCompact(v as number)}
          width={66}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
          formatter={(value, name) => [formatIDRCompact(Number(value)), String(name)]}
        />
        <Area
          type="monotone"
          dataKey="cost"
          name="Cost"
          stroke="#3B82F6"
          strokeWidth={1.5}
          fill="url(#cost)"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#FAFAF9"
          strokeWidth={2}
          fill="url(#rev)"
        />
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke="#F7F7F8"
          strokeDasharray="4 4"
          strokeWidth={1.4}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
