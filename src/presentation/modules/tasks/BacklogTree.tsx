"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import type { EpicNode, StoryNode } from "@/application/use-cases/tasks/GetProjectBoard";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { mockProjects } from "@/infrastructure/data/projects.mock";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { cn } from "@/lib/cn";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));
const projectMap = new Map(mockProjects.map((p) => [p.id, p]));

const PRIORITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const TASK_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Backlog: "neutral",
  "To Do": "info",
  "In Progress": "wit",
  Review: "warning",
  QA: "warning",
  Done: "success",
};

const STORY_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Backlog: "neutral",
  Ready: "info",
  "In Progress": "wit",
  Review: "warning",
  Done: "success",
};

const EPIC_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Discovery: "info",
  "In Progress": "wit",
  "At Risk": "danger",
  Done: "success",
  Cancelled: "neutral",
};

export function BacklogTree({ epics }: { epics: EpicNode[] }) {
  const [expandedEpic, setExpandedEpic] = useState<string | null>(epics[0]?.id ?? null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(
    () => new Set(epics[0]?.stories[0] ? [epics[0].stories[0].id] : []),
  );

  const toggleStory = (id: string) =>
    setExpandedStories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className="space-y-3">
      {epics.map((epic) => {
        const expanded = expandedEpic === epic.id;
        const project = projectMap.get(epic.projectId);
        const owner = teamMap.get(epic.ownerId);
        const pct =
          epic.committedPoints > 0
            ? Math.round((epic.completedPoints / epic.committedPoints) * 100)
            : 0;

        return (
          <li key={epic.id} className="glass-soft rounded-2xl border border-white/8 p-3">
            <button
              onClick={() => setExpandedEpic(expanded ? null : epic.id)}
              className="flex w-full items-center gap-3 text-left"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              )}
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${epic.color}22`,
                  color: epic.color,
                  border: `1px solid ${epic.color}44`,
                }}
              >
                Epic
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-zinc-500">{epic.code}</span>
                  <StatusBadge tone={EPIC_STATUS_TONE[epic.status]}>{epic.status}</StatusBadge>
                  {project ? (
                    <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                      {project.code}
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-zinc-50">
                  {epic.name}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-400">{epic.description}</div>
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
                    {epic.completedPoints} / {epic.committedPoints} pt
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {epic.storyCount} stories · {epic.taskCount} tasks
                  </span>
                </div>
              </div>
              {owner ? (
                <Avatar name={owner.name} initials={owner.initials} color={owner.avatarColor} size="sm" />
              ) : null}
            </button>

            {expanded ? (
              <ul className="mt-3 space-y-2 pl-7">
                {epic.stories.map((story) => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    epicColor={epic.color}
                    expanded={expandedStories.has(story.id)}
                    onToggle={() => toggleStory(story.id)}
                  />
                ))}
                {epic.stories.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[10px] text-zinc-500">
                    No stories yet under this epic.
                  </li>
                ) : null}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function StoryRow({
  story,
  epicColor,
  expanded,
  onToggle,
}: {
  story: StoryNode;
  epicColor: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const owner = teamMap.get(story.ownerId);
  const totalPoints = Math.max(story.storyPoints, story.taskPointsTotal);
  const pct = totalPoints > 0 ? Math.round((story.taskPointsCompleted / totalPoints) * 100) : 0;

  return (
    <li className="rounded-xl border border-white/6 bg-white/[0.02]">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        )}
        <span
          className="grid h-7 w-7 place-items-center rounded-lg text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: `${epicColor}18`,
            color: epicColor,
          }}
        >
          Story
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-500">{story.code}</span>
            <StatusBadge tone={STORY_STATUS_TONE[story.status]}>{story.status}</StatusBadge>
            <StatusBadge tone={PRIORITY_TONE[story.priority]} dot>
              {story.priority}
            </StatusBadge>
            <span className="rounded-full bg-white/6 px-1.5 py-0.5 font-mono text-[9px] text-zinc-300">
              {story.storyPoints} pt
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs font-semibold text-zinc-100">{story.title}</div>
          <div className="mt-0.5 truncate text-[10px] italic text-zinc-400">
            As a {story.asA}, I want {story.iWant} — so that {story.soThat}.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-1 w-20 overflow-hidden rounded-full bg-white/8">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #34D399, #FBBF24)",
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-300">
            {story.taskPointsCompleted}/{totalPoints} pt
          </span>
          {owner ? (
            <Avatar name={owner.name} initials={owner.initials} color={owner.avatarColor} size="sm" />
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-white/6 px-3 py-3">
          {story.acceptanceCriteria.length > 0 ? (
            <div className="mb-3">
              <div className="mb-1 text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                Acceptance criteria
              </div>
              <ul className="space-y-0.5 text-[11px] text-zinc-300">
                {story.acceptanceCriteria.map((ac, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
                    <span>{ac}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mb-1 text-[9px] uppercase tracking-[0.18em] text-zinc-500">
            Sprint tasks ({story.tasks.length})
          </div>
          {story.tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/8 p-2 text-center text-[10px] text-zinc-500">
              No sprint tasks have been carved out yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {story.tasks.map((task) => {
                const assignee = teamMap.get(task.assigneeId);
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "grid grid-cols-12 items-center gap-2 rounded-lg px-2 py-1.5 text-[11px]",
                      "hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="col-span-2 font-mono text-[10px] text-zinc-400">{task.code}</span>
                    <span className="col-span-5 truncate text-zinc-100">{task.title}</span>
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
      ) : null}
    </li>
  );
}
