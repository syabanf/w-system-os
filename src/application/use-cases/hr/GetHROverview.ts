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

export interface HROverviewDTO {
  employees: Employee[];
  headcount: number;
  activeCount: number;
  onLeaveCount: number;
  newHiresThisQuarter: number;
  byDepartment: { department: string; count: number }[];
  byEmploymentType: { type: string; count: number }[];
  attendance: {
    totalRecords: number;
    presentRate: number;
    lateRate: number;
    leaveRate: number;
    overtimeHours: number;
    daySeries: { date: string; Present: number; Late: number; Leave: number; Remote: number; Absent: number }[];
  };
  leave: {
    pendingRequests: LeaveRequest[];
    approvedThisMonth: number;
    averageRemaining: number;
    upcoming: (LeaveRequest & { employeeName: string })[];
    balanceByType: { type: LeaveBalance["type"]; entitled: number; used: number; remaining: number }[];
  };
  payroll: {
    period: string;
    items: (PayrollItem & { employeeName: string; department: string; position: string })[];
    totalGross: number;
    totalNet: number;
    totalPph21: number;
    totalBpjs: number;
    draftCount: number;
  };
}

export class GetHROverview {
  constructor(
    private employees: EmployeeRepository,
    private attendance: AttendanceRepository,
    private leave: LeaveRepository,
    private payroll: PayrollRepository,
  ) {}

  async execute(): Promise<HROverviewDTO> {
    const [emps, attRecords, leaveReqs, leaveBalances, period] = await Promise.all([
      this.employees.getAll(),
      this.attendance.getRecent(),
      this.leave.getRequests(),
      this.leave.getBalances(),
      this.payroll.getLatestPeriod(),
    ]);
    const payrollRun = await this.payroll.getRun(period);

    // Headcount metrics
    const activeCount = emps.filter((e) => e.status === "active").length;
    const onLeaveCount = emps.filter((e) => e.status === "on-leave").length;
    const newHiresThisQuarter = emps.filter((e) => e.joinDate >= "2026-04-01").length;

    const deptMap = new Map<string, number>();
    emps.forEach((e) => deptMap.set(e.department, (deptMap.get(e.department) ?? 0) + 1));
    const byDepartment = Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    const typeMap = new Map<string, number>();
    emps.forEach((e) => typeMap.set(e.employmentType, (typeMap.get(e.employmentType) ?? 0) + 1));
    const byEmploymentType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

    // Attendance metrics
    const totalRecords = attRecords.length;
    const presentCount = attRecords.filter((r) => r.status === "Present" || r.status === "Remote").length;
    const lateCount = attRecords.filter((r) => r.status === "Late").length;
    const leaveCount = attRecords.filter((r) => r.status === "Leave").length;
    const overtimeHours = attRecords.reduce((s, r) => s + r.overtimeHours, 0);

    const dayMap = new Map<string, AttendanceRecord["status"][]>();
    attRecords.forEach((r) => {
      const list = dayMap.get(r.date) ?? [];
      list.push(r.status);
      dayMap.set(r.date, list);
    });
    const daySeries = Array.from(dayMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, statuses]) => ({
        date,
        Present: statuses.filter((s) => s === "Present").length,
        Late: statuses.filter((s) => s === "Late").length,
        Leave: statuses.filter((s) => s === "Leave").length,
        Remote: statuses.filter((s) => s === "Remote").length,
        Absent: statuses.filter((s) => s === "Absent").length,
      }));

    // Leave metrics
    const pendingRequests = leaveReqs.filter((r) => r.status === "pending");
    const approvedThisMonth = leaveReqs.filter(
      (r) => r.status === "approved" && r.submittedAt.startsWith("2026-05"),
    ).length;

    const annualBalances = leaveBalances.filter((b) => b.type === "Annual");
    const averageRemaining =
      annualBalances.length > 0
        ? annualBalances.reduce((s, b) => s + b.remaining, 0) / annualBalances.length
        : 0;

    const empNameMap = new Map(emps.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));
    const upcoming = leaveReqs
      .filter((r) => r.status === "approved" || r.status === "pending")
      .filter((r) => r.startDate >= "2026-05-19")
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
      .slice(0, 6)
      .map((r) => ({ ...r, employeeName: empNameMap.get(r.employeeId) ?? "Unknown" }));

    const balanceByTypeMap = new Map<LeaveBalance["type"], { entitled: number; used: number; remaining: number }>();
    leaveBalances.forEach((b) => {
      const cur = balanceByTypeMap.get(b.type) ?? { entitled: 0, used: 0, remaining: 0 };
      cur.entitled += b.entitled;
      cur.used += b.used;
      cur.remaining += b.remaining;
      balanceByTypeMap.set(b.type, cur);
    });
    const balanceByType = Array.from(balanceByTypeMap.entries()).map(([type, v]) => ({
      type,
      ...v,
    }));

    // Payroll metrics
    const enrichedPayroll = payrollRun.map((p) => {
      const emp = emps.find((e) => e.id === p.employeeId);
      return {
        ...p,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown",
        department: emp?.department ?? "—",
        position: emp?.position ?? "—",
      };
    });

    return {
      employees: emps,
      headcount: emps.length,
      activeCount,
      onLeaveCount,
      newHiresThisQuarter,
      byDepartment,
      byEmploymentType,
      attendance: {
        totalRecords,
        presentRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
        lateRate: totalRecords > 0 ? (lateCount / totalRecords) * 100 : 0,
        leaveRate: totalRecords > 0 ? (leaveCount / totalRecords) * 100 : 0,
        overtimeHours,
        daySeries,
      },
      leave: {
        pendingRequests,
        approvedThisMonth,
        averageRemaining,
        upcoming,
        balanceByType,
      },
      payroll: {
        period,
        items: enrichedPayroll,
        totalGross: enrichedPayroll.reduce((s, p) => s + p.gross, 0),
        totalNet: enrichedPayroll.reduce((s, p) => s + p.netPay, 0),
        totalPph21: enrichedPayroll.reduce((s, p) => s + p.pph21, 0),
        totalBpjs: enrichedPayroll.reduce(
          (s, p) => s + p.bpjsKesEmployee + p.bpjsTkEmployee,
          0,
        ),
        draftCount: enrichedPayroll.filter((p) => p.status === "draft").length,
      },
    };
  }
}
