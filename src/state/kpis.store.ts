"use client";

import { createCRUDStore } from "./createCRUDStore";

export type KpiUnit = "IDR" | "%" | "h" | "count";
export type KpiPillar = "Growth" | "Delivery" | "People" | "Finance" | "Customer";
export type KpiDirection = "higher" | "lower";
export type KpiCadence = "Daily" | "Weekly" | "Monthly" | "Quarterly";

export interface KPI {
  id: string;
  name: string;
  pillar: KpiPillar;
  unit: KpiUnit;
  current: number;
  target: number;
  /** "higher" → current ≥ target is good. "lower" → current ≤ target is good. */
  direction: KpiDirection;
  /** Last 12 periods, oldest → newest. */
  history: number[];
  owner: string;
  cadence: KpiCadence;
}

export type KpiDraft = Omit<KPI, "id">;

const KPI_SEED: KPI[] = [
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

export const useKpisStore = createCRUDStore<KPI, KpiDraft>({
  storageKey: "wit-erp-os.kpis",
  seed: KPI_SEED,
  idPrefix: "kpi",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});
