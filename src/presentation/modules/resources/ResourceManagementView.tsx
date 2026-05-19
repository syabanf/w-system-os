"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Users2, Sparkles } from "lucide-react";
import { createResourceService } from "@/application/factories/createResourceService";
import type { UtilizationSummary } from "@/application/use-cases/resources/GetTeamUtilization";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { ResourceAllocationGrid } from "./ResourceAllocationGrid";
import { TeamCapacityPanel } from "./TeamCapacityPanel";
import { formatPercent } from "@/lib/currency";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

export function ResourceManagementView({ compact = false }: { compact?: boolean } = {}) {
  const [summary, setSummary] = useState<UtilizationSummary | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await createResourceService().getUtilization();
      if (!cancelled) setSummary(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!summary) return [];
    const q = query.trim().toLowerCase();
    if (!q) return summary.members;
    return summary.members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q)),
    );
  }, [summary, query]);

  if (!summary) return <SkeletonLoadingView />;

  return (
    <div className="space-y-5">
      {!compact ? (
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Operations · Resources
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Team & capacity
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Allocation health, skills, and where to invest hiring focus next.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, role, department, skill…"
            className="w-full sm:w-auto md:w-72 lg:w-80"
          />
          <ManageMasterDataButton moduleId="hr" />
        </div>
      </header>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Activity}
          label="Avg Utilization"
          value={formatPercent(summary.averageUtilization, 1)}
          trend={summary.averageUtilization > 95 ? "down" : "up"}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Over-allocated"
          value={String(summary.overallocatedCount)}
          trend={summary.overallocatedCount > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
        <MetricCard
          icon={Sparkles}
          label="Available"
          value={String(summary.availableCount)}
          accent="#22C55E"
        />
        <MetricCard
          icon={Users2}
          label="Headcount"
          value={String(summary.members.length)}
          delta={`${summary.byDepartment.length} departments`}
          accent="#3B82F6"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Roster"
            title={`Team (${filtered.length})`}
            description="Allocation, skills, and availability per engineer."
          />
          <ResourceAllocationGrid members={filtered} />
        </div>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="By Department" title="Capacity heatmap" />
          <TeamCapacityPanel summary={summary} />
        </div>
      </div>
    </div>
  );
}
