import type { GetTeamUtilization } from "../use-cases/resources/GetTeamUtilization";

export class ResourceService {
  constructor(private utilization: GetTeamUtilization) {}
  getUtilization() {
    return this.utilization.execute();
  }
}
