"use client";

import { CheckCircle2, ListChecks, ShieldAlert, Target, Timer } from "lucide-react";
import type { StoryNode } from "@/application/use-cases/tasks/GetProjectBoard";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";

const STORY_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Backlog: "neutral",
  Ready: "info",
  "In Progress": "wit",
  Review: "warning",
  Done: "success",
};

const TASK_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Backlog: "neutral",
  "To Do": "info",
  "In Progress": "wit",
  Review: "warning",
  QA: "warning",
  Done: "success",
};

const PRIORITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function StoryDetailView({ story, epicColor }: { story: StoryNode; epicColor: string }) {
  const owner = teamMap.get(story.ownerId);
  const totalPoints = Math.max(story.storyPoints, story.taskPointsTotal);
  const pct = totalPoints > 0 ? Math.round((story.taskPointsCompleted / totalPoints) * 100) : 0;
  const doneCount = story.tasks.filter((t) => t.status === "Done").length;

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${epicColor}18`,
                  color: epicColor,
                }}
              >
                Story
              </span>
              <span className="font-mono text-[10px] text-zinc-500">{story.code}</span>
              <StatusBadge tone={STORY_STATUS_TONE[story.status]}>{story.status}</StatusBadge>
              <StatusBadge tone={PRIORITY_TONE[story.priority]} dot>
                {story.priority}
              </StatusBadge>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {story.title}
            </h2>
            <p className="mt-2 max-w-2xl text-xs italic text-zinc-400">
              As a <span className="text-zinc-200">{story.asA}</span>, I want{" "}
              <span className="text-zinc-200">{story.iWant}</span> — so that{" "}
              <span className="text-zinc-200">{story.soThat}</span>.
            </p>
            {owner ? (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-zinc-300">
                <Avatar
                  name={owner.name}
                  initials={owner.initials}
                  color={owner.avatarColor}
                  size="sm"
                />
                <span>{owner.name}</span>
                <span className="text-zinc-500">· {owner.role}</span>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-[180px] flex-col items-end gap-1.5">
            <div className="relative h-2 w-44 overflow-hidden rounded-full bg-white/8">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #34D399, #FBBF24)",
                }}
              />
            </div>
            <span className="font-mono text-[11px] text-zinc-200">
              {story.taskPointsCompleted}/{totalPoints} pt · {pct}%
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={ListChecks}
          label="Tasks"
          value={String(story.tasks.length)}
          delta={`${doneCount} done`}
          trend={doneCount === story.tasks.length && story.tasks.length > 0 ? "up" : "flat"}
        />
        <MetricCard
          icon={Target}
          label="Story points"
          value={String(story.storyPoints)}
          accent="#3B82F6"
        />
        <MetricCard
          icon={Timer}
          label="In flight"
          value={String(
            story.tasks.filter(
              (t) => t.status === "In Progress" || t.status === "Review" || t.status === "QA",
            ).length,
          )}
          accent="#F59E0B"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Blocked"
          value={String(story.blockedCount)}
          trend={story.blockedCount > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
      </div>

      {story.acceptanceCriteria.length > 0 ? (
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Definition of Done"
            title="Acceptance criteria"
            description="What needs to be true before this story can ship."
          />
          <ul className="space-y-1.5 text-[12px] text-zinc-200">
            {story.acceptanceCriteria.map((ac, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{ac}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Sprint tasks"
          title={`Tasks (${story.tasks.length})`}
          description="Individual units of work — these flow through the sprint board."
        />
        {story.tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No sprint tasks have been carved out for this story yet.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {story.tasks.map((task) => {
              const assignee = teamMap.get(task.assigneeId);
              return (
                <li
                  key={task.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
                >
                  <span className="col-span-2 font-mono text-[10px] text-zinc-400">
                    {task.code}
                  </span>
                  <span className="col-span-5 truncate text-[12px] text-zinc-100">
                    {task.title}
                  </span>
                  <span className="col-span-2">
                    <StatusBadge tone={TASK_STATUS_TONE[task.status]}>{task.status}</StatusBadge>
                  </span>
                  <span className="col-span-1 font-mono text-[10px] text-zinc-300">
                    {task.storyPoints}pt
                  </span>
                  <span className="col-span-2 flex items-center justify-end gap-1.5">
                    {task.blocked ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] text-rose-300"
                        title={task.blockerReason}
                      >
                        <ShieldAlert className="h-2.5 w-2.5" />
                        Blocked
                      </span>
                    ) : null}
                    {assignee ? (
                      <Avatar
                        name={assignee.name}
                        initials={assignee.initials}
                        color={assignee.avatarColor}
                        size="sm"
                      />
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
