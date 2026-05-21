"use client";

import { useEffect, useState } from "react";
import { Briefcase, Calendar, Mail, MapPin } from "lucide-react";
import type { ClientPortfolioItem } from "@/application/use-cases/clients/GetClientPortfolio";
import type { Project } from "@/domain/entities/Project";
import { Avatar } from "@/presentation/shared/Avatar";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { createProjectService } from "@/application/factories/createProjectService";
import { formatIDRCompact, formatPercent } from "@/lib/currency";

const HEALTH_TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  excellent: "success",
  stable: "info",
  "at-risk": "warning",
  "churn-risk": "danger",
};

export function ClientProfilePanel({ client }: { client: ClientPortfolioItem }) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await createProjectService().getOverview();
      if (!cancelled) {
        setProjects(all.filter((p) => p.clientId === client.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client.id]);

  return (
    <aside className="glass rounded-[20px] p-5">
      <header className="flex items-start gap-3">
        <Avatar name={client.name} color={client.logoColor} size="lg" />
        <div className="flex-1">
          <div className="text-base font-semibold text-zinc-50">{client.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
            <span>{client.industry}</span>
            <span className="text-zinc-600">·</span>
            <MapPin className="h-3 w-3" />
            <span>{client.region}</span>
          </div>
          <div className="mt-2">
            <StatusBadge tone={HEALTH_TONE[client.health]} dot>
              {client.health}
            </StatusBadge>
            {client.retainerActive ? (
              <StatusBadge tone="wit" className="ml-1.5">
                Active retainer
              </StatusBadge>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <Stat label="Contract LTV" value={formatIDRCompact(client.contractValue)} />
        <Stat label="Active projects" value={String(client.projectCount)} />
        <Stat label="Satisfaction" value={formatPercent(client.satisfactionScore, 0)} />
        <Stat
          label="Renewal"
          value={new Date(client.renewalDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          icon={<Calendar className="h-3 w-3" />}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Primary contact</div>
        <div className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 p-3">
          <Avatar name={client.primaryContact} color="#3B82F6" size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-zinc-100">{client.primaryContact}</div>
            <div className="flex items-center gap-1 truncate text-[10px] text-zinc-400">
              <Mail className="h-3 w-3" />
              {client.contactEmail}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <span>Active engagements</span>
          <span>{projects.length}</span>
        </div>
        <ul className="space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 p-3"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-300">
                <Briefcase className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-zinc-100">{p.name}</div>
                <div className="text-[10px] text-zinc-400">{p.code} · {p.status}</div>
              </div>
              <span className="font-mono text-[11px] text-zinc-300">{p.progress}%</span>
            </li>
          ))}
          {projects.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[10px] text-zinc-500">
              No active engagements.
            </li>
          ) : null}
        </ul>
      </div>
    </aside>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="glass-soft rounded-xl border border-white/6 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-zinc-50">
        {icon}
        {value}
      </div>
    </div>
  );
}
