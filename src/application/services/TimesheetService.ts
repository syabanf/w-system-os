import type { GetTimesheetSummary } from "../use-cases/timesheet/GetTimesheetSummary";

export class TimesheetService {
  constructor(private summary: GetTimesheetSummary) {}
  getSummary() {
    return this.summary.execute();
  }
}
