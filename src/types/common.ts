export type ID = string;
export type ISODate = string;

export type Trend = "up" | "down" | "flat";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: Trend;
  hint?: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}
