"use client";

import { Calendar, ChevronRight, Layers, ListChecks, ShieldAlert, Target } from "lucide-react";
import type { EpicNode, StoryNode } from "@/application/use-cases/tasks/GetProjectBoard";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";

const EPIC_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Discovery: "info",
  "In Progress": "wit",
  "At Risk": "danger",
  Done: "success",
  Cancelled: "neutral",
};

const STORY_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Backlog: "neutral",
  Ready: "info",
  "In Progress": "wit",
  Review: "warning",
  Done: "success",
};

const PRIORITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

interface EpicDetailViewProps {
  epic: EpicNode;
  onOpenStory: (storyId: string) => void;
}

export function EpicDetailView({ epic, onOpenStory }: EpicDetailViewProps) {
  const owner = teamMap.get(epic.ownerId);
  const completedStories = epic.stories.filter((s) => s.status === "Done").length;
  const blockedTasks = epic.stories.reduce((s, st) => s + st.blockedCount, 0);
  const pct =
    epic.rolledUpCommitted > 0
      ? Math.round((epic.rolledUpCompleted / epic.rolledUpCommitted) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
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
              <span className="font-mono text-[10px] text-zinc-500">{epic.code}</span>
              <StatusBadge tone={EPIC_STATUS_TONE[epic.status]}>{epic.status}</StatusBadge>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {epic.name}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-zinc-400">{epic.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {epic.startDate} → {epic.targetDate}
              </span>
              {owner ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar
                    name={owner.name}
                    initials={owner.initials}
                    color={owner.avatarColor}
                    size="sm"
                  />
                  <span className="text-zinc-300">{owner.name}</span>
                  <span className="text-zinc-500">· {owner.role}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-[180px] flex-col items-end gap-1.5">
            <div className="relative h-2 w-44 overflow-hidden rounded-full bg-white/8">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${epic.color}, ${epic.color}aa)`,
                }}
              />
            </div>
            <span className="font-mono text-[11px] text-zinc-200">
              {epic.rolledUpCompleted} / {epic.rolledUpCommitted} pt · {pct}%
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Layers}
          label="Stories"
          value={String(epic.storyCount)}
          delta={`${completedStories} done`}
          trend={completedStories === epic.storyCount ? "up" : "flat"}
        />
        <MetricCard
          icon={ListChecks}
          label="Tasks"
          value={String(epic.taskCount)}
          accent="#3B82F6"
        />
        <MetricCard
          icon={Target}
          label="Committed pts"
          value={String(epic.committedPoints)}
          delta={`${epic.completedPoints} closed`}
          accent="#22C55E"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Blocked"
          value={String(blockedTasks)}
          trend={blockedTasks > 0 ? "down" : "flat"}
          accent="#EF4444"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="User Stories"
          title={`Stories (${epic.stories.length})`}
          description="Drill into any story to see acceptance criteria + the sprint tasks underneath."
        />
        {epic.stories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No stories under this epic yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {epic.stories.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                epicColor={epic.color}
                onOpen={() => onOpenStory(story.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StoryRow({
  story,
  epicColor,
  onOpen,
}: {
  story: StoryNode;
  epicColor: string;
  onOpen: () => void;
}) {
  const owner = teamMap.get(story.ownerId);
  const totalPoints = Math.max(story.storyPoints, story.taskPointsTotal);
  const pct = totalPoints > 0 ? Math.round((story.taskPointsCompleted / totalPoints) * 100) : 0;

  return (
    <li>
      <button
        onClick={onOpen}
        className="glass-soft group flex w-full items-center gap-3 rounded-xl border border-white/6 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-white/20"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: `${epicColor}18`,
            color: epicColor,
          }}
        >
          Story
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-500">{story.code}</span>
            <StatusBadge tone={STORY_STATUS_TONE[story.status]}>{story.status}</StatusBadge>
            <StatusBadge tone={PRIORITY_TONE[story.priority]} dot>
              {story.priority}
            </StatusBadge>
            <span className="rounded-full bg-white/6 px-1.5 py-0.5 font-mono text-[9px] text-zinc-300">
              {story.storyPoints} pt
            </span>
            {story.blockedCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] text-rose-300">
                <ShieldAlert className="h-2.5 w-2.5" />
                {story.blockedCount} blocked
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-zinc-100">{story.title}</div>
          <div className="mt-0.5 truncate text-[11px] italic text-zinc-400">
            As a {story.asA}, I want {story.iWant} — so that {story.soThat}.
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-1 w-32 overflow-hidden rounded-full bg-white/8">
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
            <span className="text-[10px] text-zinc-500">{story.tasks.length} tasks</span>
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
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    </li>
  );
}
