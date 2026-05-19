import type { TaskRepository, SprintRepository } from "@/domain/repositories/TaskRepository";
import type { Sprint } from "@/domain/entities/Sprint";
import type { Task } from "@/domain/entities/Task";

export interface SprintSummary {
  sprint: Sprint;
  tasks: Task[];
  byStatus: Record<string, Task[]>;
  blockedCount: number;
  completionRate: number;
}

export class GetSprintSummary {
  constructor(
    private sprints: SprintRepository,
    private tasks: TaskRepository,
  ) {}

  async execute(): Promise<SprintSummary[]> {
    const sprints = await this.sprints.getActive();
    const summaries: SprintSummary[] = [];

    for (const sprint of sprints) {
      const tasks = await this.tasks.getBySprintId(sprint.id);
      const byStatus: Record<string, Task[]> = {};
      tasks.forEach((t) => {
        byStatus[t.status] = byStatus[t.status] ?? [];
        byStatus[t.status].push(t);
      });
      const blockedCount = tasks.filter((t) => t.blocked).length;
      const completionRate = sprint.committedPoints > 0
        ? (sprint.completedPoints / sprint.committedPoints) * 100
        : 0;
      summaries.push({ sprint, tasks, byStatus, blockedCount, completionRate });
    }

    return summaries;
  }
}
