import type { GetSprintSummary } from "../use-cases/tasks/GetSprintSummary";
import type { CalculateBurndown } from "../use-cases/tasks/CalculateBurndown";
import type { GetProjectBoard } from "../use-cases/tasks/GetProjectBoard";
import type { Sprint } from "@/domain/entities/Sprint";

export class SprintService {
  constructor(
    private summary: GetSprintSummary,
    private burndown: CalculateBurndown,
    private board: GetProjectBoard,
  ) {}
  getActiveSummaries() {
    return this.summary.execute();
  }
  getBurndown(sprint: Sprint) {
    return this.burndown.execute(sprint);
  }
  getProjectBoard() {
    return this.board.execute();
  }
}
