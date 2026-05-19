"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_MODULES } from "@/constants/appModules";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockInvoices } from "@/infrastructure/data/invoices.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockTasks } from "@/infrastructure/data/tasks.mock";
import { mockLeads } from "@/infrastructure/data/leads.mock";
import { mockTickets } from "@/infrastructure/data/tickets.mock";
import { mockEmployees } from "@/infrastructure/data/employees.mock";

export type SpotlightResultCategory =
  | "App"
  | "Project"
  | "Client"
  | "Invoice"
  | "Team"
  | "Task"
  | "Lead"
  | "Ticket"
  | "Employee";

export interface SpotlightResult {
  id: string;
  category: SpotlightResultCategory;
  title: string;
  subtitle: string;
  hint?: string;
  appId?: string;
}

function searchableIndex(): SpotlightResult[] {
  return [
    ...APP_MODULES.map((m) => ({
      id: `app-${m.id}`,
      category: "App" as const,
      title: m.name,
      subtitle: m.description,
      hint: "Open app",
      appId: m.id,
    })),
    ...mockProjects.map((p) => ({
      id: `proj-${p.id}`,
      category: "Project" as const,
      title: p.name,
      subtitle: `${p.code} · ${p.status} · ${p.progress}%`,
      appId: "projects",
    })),
    ...mockClients.map((c) => ({
      id: `cli-${c.id}`,
      category: "Client" as const,
      title: c.name,
      subtitle: `${c.industry} · ${c.region}`,
      appId: "clients",
    })),
    ...mockInvoices.map((i) => ({
      id: `inv-${i.id}`,
      category: "Invoice" as const,
      title: i.number,
      subtitle: `${i.status.toUpperCase()} · IDR ${i.amount.toLocaleString("id-ID")}`,
      appId: "transaction",
    })),
    ...mockTeam.map((m) => ({
      id: `tm-${m.id}`,
      category: "Team" as const,
      title: m.name,
      subtitle: `${m.role} · ${m.department}`,
      appId: "hr",
    })),
    ...mockTasks.map((t) => ({
      id: `tsk-${t.id}`,
      category: "Task" as const,
      title: t.title,
      subtitle: `${t.code} · ${t.status} · ${t.priority}`,
      appId: "projects",
    })),
    ...mockLeads.map((l) => ({
      id: `lead-${l.id}`,
      category: "Lead" as const,
      title: l.companyName,
      subtitle: `${l.stage} · ${l.source} · IDR ${l.dealValue.toLocaleString("id-ID")}`,
      appId: "leads",
    })),
    ...mockTickets.map((t) => ({
      id: `tk-${t.id}`,
      category: "Ticket" as const,
      title: t.title,
      subtitle: `${t.code} · ${t.severity.toUpperCase()} · ${t.status}`,
      appId: "support",
    })),
    ...mockEmployees.map((e) => ({
      id: `emp-${e.id}`,
      category: "Employee" as const,
      title: `${e.firstName} ${e.lastName}`,
      subtitle: `${e.employeeNumber} · ${e.position} · ${e.department}`,
      appId: "hr",
    })),
  ];
}

export function useSpotlightSearch(query: string) {
  const [index, setIndex] = useState<SpotlightResult[]>([]);

  useEffect(() => {
    setIndex(searchableIndex());
  }, []);

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
