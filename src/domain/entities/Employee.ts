import type { ID, ISODate } from "@/types/common";

export type EmploymentType = "Permanent" | "Contract" | "Probation" | "Intern";
export type EmployeeStatus = "active" | "probation" | "on-leave" | "resigned" | "terminated";

export interface Employee {
  id: ID;
  memberId: ID;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinDate: ISODate;
  endDate?: ISODate;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  department: string;
  position: string;
  managerName: string;
  basicSalary: number;
  bpjsKes: boolean;
  bpjsTk: boolean;
  bankAccount: string;
}

export type AttendanceStatus = "Present" | "Late" | "Absent" | "Leave" | "Remote";

export interface AttendanceRecord {
  id: ID;
  employeeId: ID;
  date: ISODate;
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  overtimeHours: number;
  notes?: string;
}

export type LeaveType = "Annual" | "Sick" | "Maternity" | "Bereavement" | "Unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: ID;
  employeeId: ID;
  type: LeaveType;
  startDate: ISODate;
  endDate: ISODate;
  days: number;
  reason: string;
  status: LeaveStatus;
  approverId?: ID;
  submittedAt: ISODate;
}

export interface LeaveBalance {
  employeeId: ID;
  type: LeaveType;
  entitled: number;
  used: number;
  remaining: number;
}

export interface PayrollItem {
  id: ID;
  employeeId: ID;
  period: string; // e.g. "2026-05"
  basicSalary: number;
  allowances: number;
  overtime: number;
  gross: number;
  pph21: number;
  bpjsKesEmployee: number;
  bpjsTkEmployee: number;
  otherDeductions: number;
  netPay: number;
  status: "draft" | "approved" | "paid";
}
