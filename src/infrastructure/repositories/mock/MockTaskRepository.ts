import type { TaskRepository, SprintRepository } from "@/domain/repositories/TaskRepository";
import type { Task } from "@/domain/entities/Task";
import type { Sprint } from "@/domain/entities/Sprint";
import { mockTasks, mockSprints } from "@/infrastructure/data/tasks.mock";

export class MockTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    return mockTasks;
  }
  async getById(id: string): Promise<Task | null> {
    return mockTasks.find((t) => t.id === id) ?? null;
  }
  async getByProjectId(projectId: string): Promise<Task[]> {
    return mockTasks.filter((t) => t.projectId === projectId);
  }
  async getBySprintId(sprintId: string): Promise<Task[]> {
    return mockTasks.filter((t) => t.sprintId === sprintId);
  }
}

export class MockSprintRepository implements SprintRepository {
  async getAll(): Promise<Sprint[]> {
    return mockSprints;
  }
  async getActive(): Promise<Sprint[]> {
    return mockSprints.filter((s) => s.status === "active");
  }
  async getById(id: string): Promise<Sprint | null> {
    return mockSprints.find((s) => s.id === id) ?? null;
  }
}
