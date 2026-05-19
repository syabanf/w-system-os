"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DayPoint {
  date: string;
  Present: number;
  Late: number;
  Leave: number;
  Remote: number;
  Absent: number;
}

const SERIES: { key: keyof Omit<DayPoint, "date">; color: string }[] = [
  { key: "Present", color: "#34D399" },
  { key: "Remote", color: "#60A5FA" },
  { key: "Late", color: "#FBBF24" },
  { key: "Leave", color: "#C4B5FD" },
  { key: "Absent", color: "#F87171" },
];

export function AttendanceChart({ series }: { series: DayPoint[] }) {
  const data = series.map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit" }),
    ...d,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
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
        {SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
