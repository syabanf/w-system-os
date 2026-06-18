"use client";

import { useEffect, useMemo } from "react";
import { APP_MODULES } from "@/constants/appModules";
import { useSetupStore } from "@/state/setup.store";
import { useClientsStore } from "@/state/clients.store";
import { useProjectsStore } from "@/state/projects.store";
import { useInvoicesStore } from "@/state/invoices.store";
import { useLeadsStore } from "@/state/leads.store";
import { useTicketsStore } from "@/state/tickets.store";
import { useKpisStore } from "@/state/kpis.store";
import { useTasksStore } from "@/state/tasks.store";
import { useEmployeesStore } from "@/state/employees.store";
import { mockTeam } from "@/infrastructure/data/team.mock";

export type SpotlightResultCategory =
  | "App"
  | "Project"
  | "Client"
  | "Invoice"
  | "Team"
  | "Task"
  | "Lead"
  | "Ticket"
  | "Employee"
  | "KPI";

export interface SpotlightResult {
  id: string;
  category: SpotlightResultCategory;
  title: string;
  subtitle: string;
  hint?: string;
  appId?: string;
  /** Underlying record id, so a selection can deep-link to the exact record. */
  recordId?: string;
}

/**
 * Global search index. Sources every entity from its LIVE Zustand store (not the
 * static mocks) so records created or edited via CRUD dialogs or Reddie appear
 * and stay current. Team is the one exception — it's a static allocation list
 * with no store.
 */
export function useSpotlightSearch(query: string) {
  const clients = useClientsStore((s) => s.items);
  const projects = useProjectsStore((s) => s.items);
  const invoices = useInvoicesStore((s) => s.items);
  const leads = useLeadsStore((s) => s.items);
  const tickets = useTicketsStore((s) => s.items);
  const kpis = useKpisStore((s) => s.items);
  const tasks = useTasksStore((s) => s.items);
  const employees = useEmployeesStore((s) => s.employees);
  const enabled = useSetupStore((s) => s.enabled);

  // Make sure every store has pulled its persisted data at least once, so search
  // reflects the real workspace even before a module window has been opened.
  useEffect(() => {
    useClientsStore.getState().hydrate();
    useProjectsStore.getState().hydrate();
    useInvoicesStore.getState().hydrate();
    useLeadsStore.getState().hydrate();
    useTicketsStore.getState().hydrate();
    useKpisStore.getState().hydrate();
    useTasksStore.getState().hydrate();
    useEmployeesStore.getState().hydrate();
  }, []);

  const index = useMemo<SpotlightResult[]>(
    () => [
      ...APP_MODULES.filter((m) => enabled.includes(m.id)).map((m) => ({
        id: `app-${m.id}`,
        category: "App" as const,
        title: m.name,
        subtitle: m.description,
        hint: "Open app",
        appId: m.id,
      })),
      ...projects.map((p) => ({
        id: `proj-${p.id}`,
        category: "Project" as const,
        title: p.name,
        subtitle: `${p.code} · ${p.status} · ${p.progress}%`,
        appId: "projects",
        recordId: p.id,
      })),
      ...clients.map((c) => ({
        id: `cli-${c.id}`,
        category: "Client" as const,
        title: c.name,
        subtitle: `${c.industry} · ${c.region}`,
        appId: "clients",
        recordId: c.id,
      })),
      ...invoices.map((i) => ({
        id: `inv-${i.id}`,
        category: "Invoice" as const,
        title: i.number,
        subtitle: `${i.status.toUpperCase()} · IDR ${i.amount.toLocaleString("id-ID")}`,
        appId: "transaction",
        recordId: i.id,
      })),
      ...mockTeam.map((m) => ({
        id: `tm-${m.id}`,
        category: "Team" as const,
        title: m.name,
        subtitle: `${m.role} · ${m.department}`,
        appId: "hr",
        recordId: m.id,
      })),
      ...tasks.map((t) => ({
        id: `tsk-${t.id}`,
        category: "Task" as const,
        title: t.title,
        subtitle: `${t.code} · ${t.status} · ${t.priority}`,
        appId: "projects",
        recordId: t.id,
      })),
      ...leads.map((l) => ({
        id: `lead-${l.id}`,
        category: "Lead" as const,
        title: l.companyName,
        subtitle: `${l.stage} · ${l.source} · IDR ${l.dealValue.toLocaleString("id-ID")}`,
        appId: "leads",
        recordId: l.id,
      })),
      ...tickets.map((t) => ({
        id: `tk-${t.id}`,
        category: "Ticket" as const,
        title: t.title,
        subtitle: `${t.code} · ${t.severity.toUpperCase()} · ${t.status}`,
        appId: "support",
        recordId: t.id,
      })),
      ...kpis.map((k) => ({
        id: `kpi-${k.id}`,
        category: "KPI" as const,
        title: k.name,
        subtitle: `${k.owner} · ${k.current.toLocaleString("id-ID")} / ${k.target.toLocaleString("id-ID")} ${k.unit}`,
        appId: "kpis",
        recordId: k.id,
      })),
      ...employees.map((e) => ({
        id: `emp-${e.id}`,
        category: "Employee" as const,
        title: `${e.firstName} ${e.lastName}`,
        subtitle: `${e.employeeNumber} · ${e.position} · ${e.department}`,
        appId: "hr",
        recordId: e.id,
      })),
    ],
    [clients, projects, invoices, leads, tickets, kpis, tasks, employees, enabled],
  );

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // No query → show app launcher results first (most useful idle state),
      // then a sample of each entity type.
      const apps = index.filter((r) => r.category === "App");
      const others = index.filter((r) => r.category !== "App").slice(0, 6);
      return [...apps, ...others];
    }
    // Rank: title matches above subtitle matches; prefix matches above contains.
    const scored = index
      .map((r) => {
        const t = r.title.toLowerCase();
        const s = r.subtitle.toLowerCase();
        let score = 0;
        if (t.startsWith(q)) score += 100;
        else if (t.includes(q)) score += 50;
        if (s.includes(q)) score += 10;
        return { r, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map((x) => x.r);
    return scored;
  }, [query, index]);
}
