"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatIDRCompact } from "@/lib/currency";
import type { LeadSourceMetric } from "@/domain/entities/LeadSource";

export function SourcePerformanceChart({ rows }: { rows: LeadSourceMetric[] }) {
  const data = rows.map((r) => ({
    source: r.source,
    Pipeline: Math.round(r.totalValue),
    Conversion: Math.round(r.conversionRate),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="source" stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} />
        <YAxis
          yAxisId="left"
          stroke="#A1A1AA"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          tickFormatter={(v) => formatIDRCompact(v as number)}
          width={60}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#A1A1AA"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          tickFormatter={(v) => `${v}%`}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
          formatter={(v, n) => {
            if (n === "Pipeline") return [formatIDRCompact(Number(v)), "Pipeline"];
            return [`${v}%`, "Conversion"];
          }}
        />
        <Bar yAxisId="left" dataKey="Pipeline" fill="#FBCFE8" fillOpacity={0.85} radius={[6, 6, 0, 0]} />
        <Bar yAxisId="right" dataKey="Conversion" fill="#A7F3D0" fillOpacity={0.85} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
