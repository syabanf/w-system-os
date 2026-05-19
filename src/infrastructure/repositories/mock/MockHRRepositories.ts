import type {
  EmployeeRepository,
  AttendanceRepository,
  LeaveRepository,
  PayrollRepository,
} from "@/domain/repositories/EmployeeRepository";
import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  PayrollItem,
} from "@/domain/entities/Employee";
import {
  mockEmployees,
  mockAttendance,
  mockLeaveRequests,
  mockLeaveBalances,
  mockPayroll,
  PAYROLL_PERIOD,
} from "@/infrastructure/data/employees.mock";

export class MockEmployeeRepository implements EmployeeRepository {
  async getAll(): Promise<Employee[]> {
    return mockEmployees;
  }
  async getById(id: string): Promise<Employee | null> {
    return mockEmployees.find((e) => e.id === id) ?? null;
  }
}

export class MockAttendanceRepository implements AttendanceRepository {
  async getRecent(limit = 200): Promise<AttendanceRecord[]> {
    return mockAttendance.slice(0, limit);
  }
  async getByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    return mockAttendance.filter((a) => a.employeeId === employeeId);
  }
}

export class MockLeaveRepository implements LeaveRepository {
  async getRequests(): Promise<LeaveRequest[]> {
    return mockLeaveRequests;
  }
  async getPending(): Promise<LeaveRequest[]> {
    return mockLeaveRequests.filter((r) => r.status === "pending");
  }
  async getBalances(): Promise<LeaveBalance[]> {
    return mockLeaveBalances;
  }
}

export class MockPayrollRepository implements PayrollRepository {
  async getRun(period: string): Promise<PayrollItem[]> {
    return mockPayroll.filter((p) => p.period === period);
  }
  async getLatestPeriod(): Promise<string> {
    return PAYROLL_PERIOD;
  }
}
