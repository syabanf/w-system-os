import {
  MockEmployeeRepository,
  MockAttendanceRepository,
  MockLeaveRepository,
  MockPayrollRepository,
} from "@/infrastructure/repositories/mock/MockHRRepositories";
import { GetHROverview } from "../use-cases/hr/GetHROverview";
import { HRService } from "../services/HRService";

export function createHRService(): HRService {
  return new HRService(
    new GetHROverview(
      new MockEmployeeRepository(),
      new MockAttendanceRepository(),
      new MockLeaveRepository(),
      new MockPayrollRepository(),
    ),
  );
}
