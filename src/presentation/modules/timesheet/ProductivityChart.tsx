"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DayPoint {
  date: string;
  total: number;
  billable: number;
}

export function ProductivityChart({ data }: { data: DayPoint[] }) {
  const formatted = data.map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit" }),
    Billable: d.billable,
    "Non-billable": Math.max(0, d.total - d.billable),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formatted} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} />
        <YAxis stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} width={28} />
        <Tooltip
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
        />
        <Bar dataKey="Billable" stackId="a" fill="#FAFAF9" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Non-billable" stackId="a" fill="#3B82F6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
