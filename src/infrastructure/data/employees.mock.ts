import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  PayrollItem,
} from "@/domain/entities/Employee";
import { mockTeam } from "./team.mock";

// Build employees from existing team mock data so we don't duplicate identities.
export const mockEmployees: Employee[] = mockTeam.map((member, idx) => {
  const [firstName, ...rest] = member.name.split(" ");
  return {
    id: `emp-${idx + 1}`.padStart(7, "0"),
    memberId: member.id,
    employeeNumber: `WIT-${String(2000 + idx + 1)}`,
    firstName,
    lastName: rest.join(" "),
    email: member.email,
    phone: `+62 8${100000000 + idx * 1234}`,
    joinDate: idx < 5 ? "2023-04-12" : idx < 10 ? "2024-08-19" : "2025-02-03",
    employmentType: idx < 3 ? "Permanent" : idx < 12 ? "Permanent" : "Contract",
    status: member.availability === "on-leave" ? "on-leave" : "active",
    department: member.department,
    position: member.role,
    managerName: idx === 4 ? "Damar Wicaksono" : "Damar Wicaksono",
    basicSalary: 12_000_000 + idx * 850_000 + (member.role.includes("Lead") ? 6_000_000 : 0),
    bpjsKes: true,
    bpjsTk: idx < 14,
    bankAccount: `BCA · ${String(1000000000 + idx * 7777).slice(0, 10)}`,
  };
});

const PERIOD = "2026-05";
const PERIOD_WEEK = ["2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15", "2026-05-16"];

const statusRoll: AttendanceRecord["status"][] = [
  "Present", "Present", "Late", "Present", "Remote",
  "Present", "Present", "Present", "Late", "Present",
  "Remote", "Present", "Present", "Present", "Leave",
  "Present",
];

export const mockAttendance: AttendanceRecord[] = mockEmployees.flatMap((emp, i) =>
  PERIOD_WEEK.map((date, dayIdx) => {
    const status = statusRoll[(i + dayIdx) % statusRoll.length];
    return {
      id: `att-${emp.id}-${date}`,
      employeeId: emp.id,
      date,
      clockIn: status === "Absent" || status === "Leave" ? undefined : status === "Late" ? "09:23" : "08:55",
      clockOut: status === "Absent" || status === "Leave" ? undefined : "18:05",
      status,
      overtimeHours: status === "Present" && (i + dayIdx) % 4 === 0 ? 1.5 : 0,
      notes: status === "Late" ? "Traffic on toll road" : undefined,
    };
  }),
);

export const mockLeaveRequests: LeaveRequest[] = [
  { id: "lr-001", employeeId: mockEmployees[2].id, type: "Annual", startDate: "2026-05-26", endDate: "2026-05-30", days: 5, reason: "Family trip Bali", status: "pending", submittedAt: "2026-05-15" },
  { id: "lr-002", employeeId: mockEmployees[6].id, type: "Sick", startDate: "2026-05-18", endDate: "2026-05-19", days: 2, reason: "Flu", status: "approved", approverId: mockEmployees[4].memberId, submittedAt: "2026-05-17" },
  { id: "lr-003", employeeId: mockEmployees[11].id, type: "Annual", startDate: "2026-06-02", endDate: "2026-06-06", days: 5, reason: "Wedding ceremony", status: "pending", submittedAt: "2026-05-18" },
  { id: "lr-004", employeeId: mockEmployees[9].id, type: "Maternity", startDate: "2026-07-15", endDate: "2026-10-15", days: 90, reason: "Maternity leave", status: "approved", approverId: mockEmployees[4].memberId, submittedAt: "2026-04-22" },
  { id: "lr-005", employeeId: mockEmployees[14].id, type: "Bereavement", startDate: "2026-05-16", endDate: "2026-05-18", days: 3, reason: "Grandfather passed away", status: "approved", approverId: mockEmployees[4].memberId, submittedAt: "2026-05-15" },
  { id: "lr-006", employeeId: mockEmployees[7].id, type: "Annual", startDate: "2026-05-28", endDate: "2026-05-30", days: 3, reason: "Long weekend", status: "pending", submittedAt: "2026-05-19" },
  { id: "lr-007", employeeId: mockEmployees[15].id, type: "Unpaid", startDate: "2026-06-15", endDate: "2026-06-20", days: 6, reason: "Personal sabbatical", status: "pending", submittedAt: "2026-05-12" },
];

const LEAVE_TYPES: LeaveBalance["type"][] = ["Annual", "Sick", "Maternity", "Bereavement", "Unpaid"];
const ENTITLED: Record<LeaveBalance["type"], number> = {
  Annual: 12,
  Sick: 12,
  Maternity: 90,
  Bereavement: 5,
  Unpaid: 0,
};

export const mockLeaveBalances: LeaveBalance[] = mockEmployees.flatMap((emp) =>
  LEAVE_TYPES.map((type) => {
    const entitled = ENTITLED[type];
    const used = type === "Annual" ? Math.min(entitled, (emp.basicSalary % 6) + 1) :
                 type === "Sick" ? Math.floor(Math.random() * 3) : 0;
    return {
      employeeId: emp.id,
      type,
      entitled,
      used,
      remaining: Math.max(0, entitled - used),
    };
  }),
);

// Indonesian PPh 21 simplified bracket calc (mock).
function calcPph21(annual: number): number {
  if (annual <= 60_000_000) return annual * 0.05;
  if (annual <= 250_000_000) return 3_000_000 + (annual - 60_000_000) * 0.15;
  if (annual <= 500_000_000) return 31_500_000 + (annual - 250_000_000) * 0.25;
  return 94_000_000 + (annual - 500_000_000) * 0.30;
}

export const mockPayroll: PayrollItem[] = mockEmployees.map((emp, i) => {
  const allowances = Math.round(emp.basicSalary * 0.18);
  const overtime = i % 5 === 0 ? 850_000 : 0;
  const gross = emp.basicSalary + allowances + overtime;
  const annualGross = gross * 12;
  const pph21Annual = calcPph21(annualGross - 54_000_000); // PTKP single
  const pph21 = Math.round(pph21Annual / 12);
  const bpjsKesEmployee = emp.bpjsKes ? Math.round(emp.basicSalary * 0.01) : 0;
  const bpjsTkEmployee = emp.bpjsTk ? Math.round(emp.basicSalary * 0.02) : 0;
  const otherDeductions = 0;
  const netPay = gross - pph21 - bpjsKesEmployee - bpjsTkEmployee - otherDeductions;
  return {
    id: `pi-${emp.id}`,
    employeeId: emp.id,
    period: PERIOD,
    basicSalary: emp.basicSalary,
    allowances,
    overtime,
    gross,
    pph21,
    bpjsKesEmployee,
    bpjsTkEmployee,
    otherDeductions,
    netPay,
    status: i % 7 === 0 ? "draft" : "approved",
  };
});

export const PAYROLL_PERIOD = PERIOD;

// ─── Employee histories (work, education, family, salary changes, allowances) ─

export interface EmployeeFamilyMember {
  id: string;
  employeeId: string;
  name: string;
  relation: "Spouse" | "Child" | "Parent" | "Sibling" | "Other";
  phone?: string;
  birthDate?: string;
  dependentForTax: boolean;
}

export interface EmployeeEducationHistory {
  id: string;
  employeeId: string;
  level: "SMA/SMK" | "D3" | "S1" | "S2" | "S3" | "Certificate";
  institution: string;
  major?: string;
  startYear: number;
  endYear?: number;
  gpa?: number;
}

export interface EmployeeWorkHistory {
  id: string;
  employeeId: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  reasonForLeaving?: string;
}

export interface EmployeeSalaryChange {
  id: string;
  employeeId: string;
  effectiveDate: string;
  amount: number;
  reason: "Hire" | "Promotion" | "Annual Adjustment" | "Market Adjustment" | "Performance" | "Other";
  notes?: string;
}

export interface EmployeeAllowance {
  id: string;
  employeeId: string;
  componentName: string;
  amount: number;
  effectiveDate: string;
  endDate?: string;
  status: "active" | "inactive";
}

const PICKS = <T,>(arr: T[], n: number): T[] => arr.slice(0, n);

export const mockFamilyMembers: EmployeeFamilyMember[] = mockEmployees.flatMap((emp, i) => {
  const list: EmployeeFamilyMember[] = [];
  if (i % 2 === 0) {
    list.push({
      id: `fm-${emp.id}-1`,
      employeeId: emp.id,
      name: `${emp.firstName === "Bagas" ? "Anindita" : emp.firstName === "Sekar" ? "Reza" : "Pasangan"} ${emp.lastName}`,
      relation: "Spouse",
      phone: `+62 81${200000000 + i * 999}`,
      birthDate: `19${85 + (i % 10)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      dependentForTax: true,
    });
  }
  if (i % 3 === 0) {
    list.push({
      id: `fm-${emp.id}-2`,
      employeeId: emp.id,
      name: `Anak Pertama ${emp.lastName}`,
      relation: "Child",
      birthDate: `20${15 + (i % 8)}-0${(i % 9) + 1}-15`,
      dependentForTax: true,
    });
  }
  return list;
});

export const mockEducationHistories: EmployeeEducationHistory[] = mockEmployees.map((emp, i) => ({
  id: `edu-${emp.id}`,
  employeeId: emp.id,
  level: i % 4 === 0 ? "S2" : "S1",
  institution: i % 3 === 0 ? "Institut Teknologi Bandung" : i % 3 === 1 ? "Universitas Indonesia" : "Universitas Gadjah Mada",
  major:
    emp.department === "Frontend" || emp.department === "Backend" || emp.department === "DevOps"
      ? "Teknik Informatika"
      : emp.department === "UI/UX"
        ? "Desain Komunikasi Visual"
        : emp.department === "QA"
          ? "Sistem Informasi"
          : "Manajemen Bisnis",
  startYear: 2010 + (i % 6),
  endYear: 2014 + (i % 6),
  gpa: 3.2 + ((i % 7) * 0.08),
}));

export const mockWorkHistories: EmployeeWorkHistory[] = mockEmployees.flatMap((emp, i) => {
  const histories: EmployeeWorkHistory[] = [];
  if (i % 2 === 0) {
    histories.push({
      id: `wh-${emp.id}-1`,
      employeeId: emp.id,
      company: i % 3 === 0 ? "Tokopedia" : i % 3 === 1 ? "Gojek" : "Bukalapak",
      position: `Junior ${emp.position.replace("Senior ", "").replace("Lead ", "")}`,
      startDate: "2018-03-15",
      endDate: "2021-06-30",
      reasonForLeaving: i % 2 === 0 ? "Career growth" : "Better opportunity",
    });
  }
  if (i % 3 === 0) {
    histories.push({
      id: `wh-${emp.id}-2`,
      employeeId: emp.id,
      company: i % 4 === 0 ? "Traveloka" : "Blibli",
      position: emp.position.replace("Senior ", "Mid-level "),
      startDate: "2021-07-01",
      endDate: "2023-03-31",
      reasonForLeaving: "Re-org",
    });
  }
  return histories;
});

export const mockSalaryHistory: EmployeeSalaryChange[] = mockEmployees.flatMap((emp) => {
  const base = emp.basicSalary;
  return [
    {
      id: `sh-${emp.id}-1`,
      employeeId: emp.id,
      effectiveDate: emp.joinDate,
      amount: Math.round(base * 0.78),
      reason: "Hire",
      notes: "Starting salary at hire date",
    },
    {
      id: `sh-${emp.id}-2`,
      employeeId: emp.id,
      effectiveDate: "2024-01-01",
      amount: Math.round(base * 0.88),
      reason: "Annual Adjustment",
      notes: "Annual merit increase",
    },
    {
      id: `sh-${emp.id}-3`,
      employeeId: emp.id,
      effectiveDate: "2025-01-01",
      amount: base,
      reason: "Annual Adjustment",
      notes: "Current",
    },
  ];
});

export const mockAllowances: EmployeeAllowance[] = mockEmployees.flatMap((emp, i) => {
  const list: EmployeeAllowance[] = [
    {
      id: `al-${emp.id}-tnj`,
      employeeId: emp.id,
      componentName: "Tunjangan Jabatan",
      amount: Math.round(emp.basicSalary * 0.10),
      effectiveDate: emp.joinDate,
      status: "active",
    },
  ];
  if (i % 2 === 0) {
    list.push({
      id: `al-${emp.id}-tr`,
      employeeId: emp.id,
      componentName: "Tunjangan Transport",
      amount: 1_500_000,
      effectiveDate: emp.joinDate,
      status: "active",
    });
  }
  if (i % 3 === 0) {
    list.push({
      id: `al-${emp.id}-mkn`,
      employeeId: emp.id,
      componentName: "Tunjangan Makan",
      amount: 800_000,
      effectiveDate: emp.joinDate,
      status: "active",
    });
  }
  if (i % 4 === 0) {
    list.push({
      id: `al-${emp.id}-pulsa`,
      employeeId: emp.id,
      componentName: "Tunjangan Pulsa",
      amount: 500_000,
      effectiveDate: "2024-06-01",
      status: "active",
    });
  }
  return list;
});

void PICKS;
