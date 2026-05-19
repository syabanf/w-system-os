import type { Epic, EpicStatus } from "@/domain/entities/Epic";
import type { UserStory } from "@/domain/entities/UserStory";
import type { Task } from "@/domain/entities/Task";
import { mockEpics, mockUserStories, TASK_TO_STORY } from "@/infrastructure/data/epics.mock";
import { mockTasks } from "@/infrastructure/data/tasks.mock";
import { mockVelocityHistory, type VelocityPoint } from "@/infrastructure/data/velocity.mock";

export interface StoryNode extends UserStory {
  tasks: Task[];
  taskPointsCompleted: number;
  taskPointsTotal: number;
  blockedCount: number;
}

export interface EpicNode extends Epic {
  stories: StoryNode[];
  storyCount: number;
  taskCount: number;
  // derived rollups from the underlying stories + tasks
  rolledUpCommitted: number;
  rolledUpCompleted: number;
}

export interface VelocityRollup {
  history: VelocityPoint[];
  averageVelocity: number;
  trend: "up" | "down" | "flat";
  rolling3: number;
  rolling6: number;
}

export interface ProjectBoardDTO {
  epics: EpicNode[];
  totalStoryPoints: number;
  completedStoryPoints: number;
  inProgressStoryPoints: number;
  blockedTaskCount: number;
  velocity: VelocityRollup;
}

function pointsOfStory(story: UserStory, tasks: Task[]): {
  storyTotal: number;
  storyCompleted: number;
  blockedCount: number;
} {
  const storyTasks = tasks.filter(
    (t) => TASK_TO_STORY[t.code] === story.code,
  );
  const storyTotal = storyTasks.reduce((s, t) => s + t.storyPoints, 0);
  const storyCompleted = storyTasks
    .filter((t) => t.status === "Done")
    .reduce((s, t) => s + t.storyPoints, 0);
  const blockedCount = storyTasks.filter((t) => t.blocked).length;
  return { storyTotal, storyCompleted, blockedCount };
}

export class GetProjectBoard {
  async execute(): Promise<ProjectBoardDTO> {
    // Build epic → story → task tree.
    const epicNodes: EpicNode[] = mockEpics.map((epic) => {
      const stories = mockUserStories
        .filter((s) => s.epicId === epic.id)
        .map<StoryNode>((story) => {
          const storyTasks = mockTasks.filter((t) => TASK_TO_STORY[t.code] === story.code);
          const { storyTotal, storyCompleted, blockedCount } = pointsOfStory(story, mockTasks);
          return {
            ...story,
            tasks: storyTasks,
            taskPointsTotal: storyTotal,
            taskPointsCompleted: storyCompleted,
            blockedCount,
          };
        });

      const taskCount = stories.reduce((s, st) => s + st.tasks.length, 0);
      const rolledUpCommitted = stories.reduce(
        (s, st) => s + Math.max(st.storyPoints, st.taskPointsTotal),
        0,
      );
      const rolledUpCompleted = stories.reduce((s, st) => s + st.taskPointsCompleted, 0);

      return {
        ...epic,
        stories,
        storyCount: stories.length,
        taskCount,
        rolledUpCommitted,
        rolledUpCompleted,
      };
    });

    // Totals across the portfolio (not just the current sprint).
    const allStoryTotals = epicNodes.flatMap((e) =>
      e.stories.map((s) => ({
        total: Math.max(s.storyPoints, s.taskPointsTotal),
        completed: s.taskPointsCompleted,
        inProgress: s.tasks
          .filter((t) => t.status === "In Progress" || t.status === "Review" || t.status === "QA")
          .reduce((sum, t) => sum + t.storyPoints, 0),
      })),
    );
    const totalStoryPoints = allStoryTotals.reduce((s, x) => s + x.total, 0);
    const completedStoryPoints = allStoryTotals.reduce((s, x) => s + x.completed, 0);
    const inProgressStoryPoints = allStoryTotals.reduce((s, x) => s + x.inProgress, 0);
    const blockedTaskCount = epicNodes.reduce(
      (s, e) => s + e.stories.reduce((s2, st) => s2 + st.blockedCount, 0),
      0,
    );

    // Velocity rollup
    const completedHistory = mockVelocityHistory.filter((v) => v.status === "completed");
    const rolling3 =
      completedHistory.slice(-3).reduce((s, p) => s + p.completed, 0) /
      Math.max(1, Math.min(3, completedHistory.length));
    const rolling6 =
      completedHistory.reduce((s, p) => s + p.completed, 0) /
      Math.max(1, completedHistory.length);
    const trend = rolling3 > rolling6 ? "up" : rolling3 < rolling6 ? "down" : "flat";

    return {
      epics: epicNodes,
      totalStoryPoints,
      completedStoryPoints,
      inProgressStoryPoints,
      blockedTaskCount,
      velocity: {
        history: mockVelocityHistory,
        averageVelocity: rolling6,
        trend,
        rolling3,
        rolling6,
      },
    };
  }
}

// Re-export status type for view convenience
export type { EpicStatus };
