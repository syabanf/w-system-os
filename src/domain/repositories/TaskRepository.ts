import type { Task } from "../entities/Task";
import type { Sprint } from "../entities/Sprint";

export interface TaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  getByProjectId(projectId: string): Promise<Task[]>;
  getBySprintId(sprintId: string): Promise<Task[]>;
}

export interface SprintRepository {
  getAll(): Promise<Sprint[]>;
  getActive(): Promise<Sprint[]>;
  getById(id: string): Promise<Sprint | null>;
}
