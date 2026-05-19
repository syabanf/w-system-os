"use client";

import { Briefcase, Calendar, Gauge, ShieldAlert, Sparkles, Target, Users2, Wallet } from "lucide-react";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import type { EpicNode } from "@/application/use-cases/tasks/GetProjectBoard";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { formatIDRCompact, formatPercent } from "@/lib/currency";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Discovery: "info",
  Planning: "info",
  "In Development": "wit",
  QA: "warning",
  UAT: "warning",
  Delivered: "success",
  Maintenance: "neutral",
};

const HEALTH_TONE = {
  green: "success" as const,
  amber: "warning" as const,
  red: "danger" as const,
};

const EPIC_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Discovery: "info",
  "In Progress": "wit",
  "At Risk": "danger",
  Done: "success",
  Cancelled: "neutral",
};

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

interface ProjectDetailViewProps {
  project: ProjectOverviewDTO;
  epics: EpicNode[];
  onOpenEpic: (epicId: string) => void;
}

export function ProjectDetailView({ project, epics, onOpenEpic }: ProjectDetailViewProps) {
  const totalCommitted = epics.reduce((s, e) => s + e.rolledUpCommitted, 0);
  const totalCompleted = epics.reduce((s, e) => s + e.rolledUpCompleted, 0);
  const totalTasks = epics.reduce((s, e) => s + e.taskCount, 0);
  const blockedCount = epics.reduce(
    (s, e) => s + e.stories.reduce((s2, st) => s2 + st.blockedCount, 0),
    0,
  );
  const team = project.teamIds.map((id) => teamMap.get(id)).filter(Boolean);

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {project.code}
              </span>
              <StatusBadge tone={STATUS_TONE[project.status]}>{project.status}</StatusBadge>
              <StatusBadge tone={HEALTH_TONE[project.health]} dot>
                {project.health}
              </StatusBadge>
              {project.riskLevel ? (
                <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                  Risk · {project.riskLevel}
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
              {project.name}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {project.clientName} · PM {project.managerName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              {project.startDate} → {project.endDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-zinc-500" />
              {formatIDRCompact(project.budget)}{" "}
              <span className="text-zinc-500">
                · {formatPercent(project.budgetUtilization, 0)} used
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
              {formatPercent(project.grossMargin, 0)} margin
            </span>
          </div>
        </div>

        {team.length > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Team</span>
            <div className="flex -space-x-1.5">
              {team.slice(0, 8).map((m) =>
                m ? (
                  <Avatar
                    key={m.id}
                    name={m.name}
                    initials={m.initials}
                    color={m.avatarColor}
                    size="sm"
                  />
                ) : null,
              )}
            </div>
            {team.length > 8 ? (
              <span className="text-[10px] text-zinc-500">+{team.length - 8}</span>
            ) : null}
          </div>
        ) : null}

        {project.techStack.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Stack</span>
            {project.techStack.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Gauge}
          label="Progress"
          value={formatPercent(project.progress, 0)}
          delta={
            totalCommitted > 0 ? `${totalCompleted}/${totalCommitted} pt rolled up` : undefined
          }
          trend={project.progress >= 75 ? "up" : project.progress >= 40 ? "flat" : "down"}
        />
        <MetricCard
          icon={Briefcase}
          label="Epics"
          value={String(epics.length)}
          delta={`${totalTasks} tasks`}
          accent="#3B82F6"
        />
        <MetricCard
          icon={Target}
          label="Open tickets"
          value={String(project.openTickets)}
          delta={`${project.changeRequests} CR`}
          accent="#F59E0B"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Blocked tasks"
          value={String(blockedCount)}
          trend={blockedCount > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Delivery"
          title={`Epics (${epics.length})`}
          description="Top-down structure: tap an epic to inspect its stories and sprint tasks."
        />
        {epics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No epics defined for this project yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {epics.map((epic) => {
              const owner = teamMap.get(epic.ownerId);
              const pct =
                epic.rolledUpCommitted > 0
                  ? Math.round((epic.rolledUpCompleted / epic.rolledUpCommitted) * 100)
                  : 0;
              const epicBlocked = epic.stories.reduce((s, st) => s + st.blockedCount, 0);
              return (
                <li key={epic.id}>
                  <button
                    onClick={() => onOpenEpic(epic.id)}
                    className="glass-soft group flex w-full items-center gap-3 rounded-xl border border-white/8 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-white/20"
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: `${epic.color}22`,
                        color: epic.color,
                        border: `1px solid ${epic.color}44`,
                      }}
                    >
                      Epic
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-500">{epic.code}</span>
                        <StatusBadge tone={EPIC_STATUS_TONE[epic.status]}>{epic.status}</StatusBadge>
                        <span className="text-[10px] text-zinc-500">
                          {epic.startDate} → {epic.targetDate}
                        </span>
                        {epicBlocked > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] text-rose-300">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            {epicBlocked} blocked
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 truncate text-sm font-semibold text-zinc-50">
                        {epic.name}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-zinc-400">
                        {epic.description}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${epic.color}, ${epic.color}aa)`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-zinc-300">
                          {epic.rolledUpCompleted} / {epic.rolledUpCommitted} pt
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {epic.storyCount} stories · {epic.taskCount} tasks
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {owner ? (
                        <Avatar
                          name={owner.name}
                          initials={owner.initials}
                          color={owner.avatarColor}
                          size="sm"
                        />
                      ) : null}
                      <Users2 className="h-3 w-3 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
