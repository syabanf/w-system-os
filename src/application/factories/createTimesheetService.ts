import { MockTimesheetRepository } from "@/infrastructure/repositories/mock/MockTimesheetRepository";
import { MockTeamRepository } from "@/infrastructure/repositories/mock/MockTeamRepository";
import { MockProjectRepository } from "@/infrastructure/repositories/mock/MockProjectRepository";
import { GetTimesheetSummary } from "../use-cases/timesheet/GetTimesheetSummary";
import { TimesheetService } from "../services/TimesheetService";

export function createTimesheetService(): TimesheetService {
  return new TimesheetService(
    new GetTimesheetSummary(
      new MockTimesheetRepository(),
      new MockTeamRepository(),
      new MockProjectRepository(),
    ),
  );
}
