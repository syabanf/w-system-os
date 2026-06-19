"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, Sparkles } from "lucide-react";
import { createDashboardService } from "@/application/factories/createDashboardService";
import type { DashboardSummaryDTO } from "@/application/dtos/DashboardDTO";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { Reveal } from "@/presentation/shared/Reveal";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { Avatar } from "@/presentation/shared/Avatar";
import { useProfileStore } from "@/state/profile.store";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { DashboardMetricGrid } from "./DashboardMetricGrid";
import { RevenueTrendChart } from "./RevenueTrendChart";
import { ProjectHealthPanel } from "./ProjectHealthPanel";
import { formatDemoToday, relativeFromNow } from "@/lib/date";
import { StatusBadge } from "@/presentation/shared/StatusBadge";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function ExecutiveDashboardView() {
  const [data, setData] = useState<DashboardSummaryDTO | null>(null);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const summary = await createDashboardService().getSummary();
      if (!cancelled) setData(summary);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Executive Briefing · {formatDemoToday()}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Good morning, <span className="headline-gradient">{profile.name.split(" ")[0]}</span>. Here&apos;s how your firm is doing.
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            A composite view of revenue, delivery health, people utilization, and risks across all
            active engagements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="glass-soft inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-300">
            <Sparkles className="h-3 w-3 text-zinc-300" />
            Live data — mock dataset
          </span>
        </div>
      </header>

      <Reveal index={0}>
        <DashboardMetricGrid data={data} />
      </Reveal>

      <Reveal index={1} className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Revenue trend"
          description="Booked revenue vs. forecast over the last 6 months."
          height={260}
        >
          <RevenueTrendChart data={data.revenueTrend} />
        </ChartCard>

        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Risk radar"
            title="Critical alerts"
            description="Top signals requiring leadership attention."
          />
          <ul className="space-y-2">
            {data.riskAlerts.map((alert) => (
              <li
                key={alert.id}
                className="glass-soft flex items-start gap-3 rounded-xl border border-white/6 p-3"
              >
                <span
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{
                    background:
                      alert.level === "critical"
                        ? "rgba(239,68,68,0.18)"
                        : alert.level === "high"
                          ? "rgba(245,158,11,0.18)"
                          : "rgba(59,130,246,0.18)",
                    color:
                      alert.level === "critical"
                        ? "#FCA5A5"
                        : alert.level === "high"
                          ? "#FCD34D"
                          : "#93C5FD",
                  }}
                >
                  <AlertOctagon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">{alert.title}</span>
                    <StatusBadge
                      tone={alert.level === "critical" ? "danger" : alert.level === "high" ? "warning" : "info"}
                    >
                      {alert.level}
                    </StatusBadge>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">{alert.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal index={2} className="grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-[20px] p-5 xl:col-span-2">
          <SectionHeader
            eyebrow="Delivery"
            title="Projects to watch"
            description="Engagements currently flagged at risk or critical."
          />
          <ProjectHealthPanel projects={data.topAtRisk} />
        </div>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Pulse"
            title="Recent team activity"
            description="What your team has been working on lately."
          />
          <ul className="space-y-2">
            {data.activityFeed.slice(0, 7).map((a) => {
              const actor = teamMap.get(a.actorId);
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  {actor ? (
                    <Avatar name={actor.name} initials={actor.initials} color={actor.avatarColor} size="sm" />
                  ) : (
                    <span className="h-7 w-7" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] leading-snug text-zinc-200">
                      <span className="font-semibold text-zinc-50">{actor?.name ?? "System"}</span>{" "}
                      {a.action}{" "}
                      <span className="text-zinc-400">— {a.target}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">{relativeFromNow(a.at)} · {a.category}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
    </div>
  );
}
