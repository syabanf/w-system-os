"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VelocityPoint } from "@/infrastructure/data/velocity.mock";

interface Props {
  history: VelocityPoint[];
  averageVelocity: number;
}

export function SprintVelocityChart({ history, averageVelocity }: Props) {
  const data = history.map((p) => ({
    label: p.sprintLabel,
    Committed: p.committed,
    Completed: p.completed,
    isActive: p.status === "active",
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} />
        <YAxis stroke="#A1A1AA" tickLine={false} axisLine={false} fontSize={10} width={36} />
        <Tooltip
          contentStyle={{
            background: "rgba(20,21,27,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#F7F7F8",
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "#A1A1AA", paddingTop: 4 }}
        />
        <Bar dataKey="Committed" fill="#C7D2FE" fillOpacity={0.45} radius={[6, 6, 0, 0]}>
          {data.map((row, i) => (
            <Cell key={i} fillOpacity={row.isActive ? 0.7 : 0.45} />
          ))}
        </Bar>
        <Bar dataKey="Completed" fill="#34D399" fillOpacity={0.85} radius={[6, 6, 0, 0]}>
          {data.map((row, i) => (
            <Cell key={i} fillOpacity={row.isActive ? 0.6 : 0.85} />
          ))}
        </Bar>
        <Line
          type="monotone"
          dataKey="Committed"
          stroke="#C7D2FE"
          strokeWidth={1}
          dot={false}
          legendType="none"
        />
        <ReferenceLine
          y={averageVelocity}
          stroke="#FBBF24"
          strokeDasharray="4 4"
          label={{
            value: `avg ${Math.round(averageVelocity)} pt`,
            fill: "#FBBF24",
            fontSize: 10,
            position: "right",
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
