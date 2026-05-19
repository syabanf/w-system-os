"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { formatIDRCompact } from "@/lib/currency";
import type { PipelineStage } from "@/application/use-cases/crm/GetSalesPipeline";

const COLORS = ["#A1A1AA", "#3B82F6", "#06B6D4", "#A855F7", "#F59E0B", "#22C55E", "#EF4444"];

export function SalesFunnelChart({ stages }: { stages: PipelineStage[] }) {
  const data = stages.map((s, i) => ({
    stage: s.stage,
    weighted: Math.round(s.weightedValue),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
        <XAxis
          type="number"
          stroke="#A1A1AA"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          tickFormatter={(v) => formatIDRCompact(v as number)}
        />
        <YAxis
          type="category"
          dataKey="stage"
          stroke="#A1A1AA"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={88}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.06)" }}
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
          formatter={(v) => [formatIDRCompact(Number(v)), "Weighted value"]}
        />
        <Bar dataKey="weighted" radius={[0, 8, 8, 0]}>
          {data.map((row, i) => (
            <Cell key={i} fill={row.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
