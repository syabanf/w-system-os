"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BurndownPoint } from "@/application/use-cases/tasks/CalculateBurndown";

export function BurndownChart({ data }: { data: BurndownPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} />
        <YAxis stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} width={32} />
        <Tooltip
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="ideal" stroke="#A1A1AA" strokeDasharray="4 4" strokeWidth={1.4} dot={false} name="Ideal" />
        <Line type="monotone" dataKey="actual" stroke="#FAFAF9" strokeWidth={2} dot={false} name="Actual" />
      </LineChart>
    </ResponsiveContainer>
  );
}
