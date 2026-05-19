import { MockSprintRepository, MockTaskRepository } from "@/infrastructure/repositories/mock/MockTaskRepository";
import { GetSprintSummary } from "../use-cases/tasks/GetSprintSummary";
import { CalculateBurndown } from "../use-cases/tasks/CalculateBurndown";
import { GetProjectBoard } from "../use-cases/tasks/GetProjectBoard";
import { SprintService } from "../services/SprintService";

export function createSprintService(): SprintService {
  return new SprintService(
    new GetSprintSummary(new MockSprintRepository(), new MockTaskRepository()),
    new CalculateBurndown(),
    new GetProjectBoard(),
  );
}
