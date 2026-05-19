"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint } from "@/infrastructure/data/analytics.mock";
import { formatIDRCompact } from "@/lib/currency";

export function CashflowChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAFAF9" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#FAFAF9" stopOpacity={0} />
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
          width={62}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
          formatter={(v, n) => [formatIDRCompact(Number(v)), String(n)]}
        />
        <Bar dataKey="cost" name="Cost" fill="#3B82F6" fillOpacity={0.45} radius={[4, 4, 0, 0]} />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FAFAF9" fill="url(#rev2)" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
