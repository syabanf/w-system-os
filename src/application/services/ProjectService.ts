import type { GetProjectOverview } from "../use-cases/projects/GetProjectOverview";
import type { GetAtRiskProjects } from "../use-cases/projects/GetAtRiskProjects";

export class ProjectService {
  constructor(
    private overview: GetProjectOverview,
    private atRisk: GetAtRiskProjects,
  ) {}
  getOverview() {
    return this.overview.execute();
  }
  getAtRiskProjects() {
    return this.atRisk.execute();
  }
}
