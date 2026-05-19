import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  PayrollItem,
} from "../entities/Employee";

export interface EmployeeRepository {
  getAll(): Promise<Employee[]>;
  getById(id: string): Promise<Employee | null>;
}

export interface AttendanceRepository {
  getRecent(limit?: number): Promise<AttendanceRecord[]>;
  getByEmployeeId(employeeId: string): Promise<AttendanceRecord[]>;
}

export interface LeaveRepository {
  getRequests(): Promise<LeaveRequest[]>;
  getPending(): Promise<LeaveRequest[]>;
  getBalances(): Promise<LeaveBalance[]>;
}

export interface PayrollRepository {
  getRun(period: string): Promise<PayrollItem[]>;
  getLatestPeriod(): Promise<string>;
}
