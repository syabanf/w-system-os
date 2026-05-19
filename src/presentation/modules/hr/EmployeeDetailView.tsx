"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  GraduationCap,
  Heart,
  Mail,
  Phone,
  Plane,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Employee } from "@/domain/entities/Employee";
import {
  mockAllowances,
  mockAttendance,
  mockEducationHistories,
  mockFamilyMembers,
  mockLeaveBalances,
  mockLeaveRequests,
  mockPayroll,
  mockSalaryHistory,
  mockWorkHistories,
} from "@/infrastructure/data/employees.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { formatIDRCompact } from "@/lib/currency";
import { cn } from "@/lib/cn";

const ATTENDANCE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Present: "success",
  Late: "warning",
  Remote: "info",
  Leave: "wit",
  Absent: "danger",
};

const LEAVE_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

type Tab = "profile" | "attendance" | "leave" | "payroll" | "compensation" | "history";

export function EmployeeDetailView({ employee }: { employee: Employee }) {
  const [tab, setTab] = useState<Tab>("profile");
  const member = teamMap.get(employee.memberId);

  const attendance = useMemo(
    () =>
      mockAttendance
        .filter((a) => a.employeeId === employee.id)
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [employee.id],
  );
  const leaveRequests = useMemo(
    () =>
      mockLeaveRequests
        .filter((l) => l.employeeId === employee.id)
        .slice()
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [employee.id],
  );
  const leaveBalances = useMemo(
    () => mockLeaveBalances.filter((b) => b.employeeId === employee.id),
    [employee.id],
  );
  const payroll = useMemo(
    () => mockPayroll.find((p) => p.employeeId === employee.id) ?? null,
    [employee.id],
  );

  const family = useMemo(
    () => mockFamilyMembers.filter((f) => f.employeeId === employee.id),
    [employee.id],
  );
  const education = useMemo(
    () => mockEducationHistories.filter((e) => e.employeeId === employee.id),
    [employee.id],
  );
  const workHistory = useMemo(
    () =>
      mockWorkHistories
        .filter((w) => w.employeeId === employee.id)
        .slice()
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [employee.id],
  );
  const salaryHistory = useMemo(
    () =>
      mockSalaryHistory
        .filter((s) => s.employeeId === employee.id)
        .slice()
        .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1)),
    [employee.id],
  );
  const allowances = useMemo(
    () => mockAllowances.filter((a) => a.employeeId === employee.id),
    [employee.id],
  );

  const attendanceRate = attendance.length
    ? attendance.filter((a) => a.status === "Present" || a.status === "Remote").length /
      attendance.length
    : 0;
  const annualBalance = leaveBalances.find((b) => b.type === "Annual");
  const totalDaysOff = leaveRequests
    .filter((l) => l.status === "approved")
    .reduce((s, l) => s + l.days, 0);

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start gap-4">
          {member ? (
            <Avatar
              name={member.name}
              initials={member.initials}
              color={member.avatarColor}
              size="lg"
            />
          ) : (
            <Avatar name={`${employee.firstName} ${employee.lastName}`} size="lg" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={
                  employee.status === "active"
                    ? "success"
                    : employee.status === "on-leave"
                      ? "warning"
                      : employee.status === "probation"
                        ? "info"
                        : "neutral"
                }
                dot
              >
                {employee.status}
              </StatusBadge>
              <StatusBadge tone="wit">{employee.employmentType}</StatusBadge>
              <span className="font-mono text-[10px] text-zinc-500">
                {employee.employeeNumber}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {employee.position} · {employee.department}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-500" />
                {employee.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                {employee.phone}
              </span>
              <span className="text-zinc-500">
                joined {employee.joinDate} · reports to {employee.managerName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={CalendarCheck}
          label="Attendance"
          value={`${Math.round(attendanceRate * 100)}%`}
          delta={`${attendance.length} days logged`}
          trend={attendanceRate > 0.9 ? "up" : "down"}
        />
        <MetricCard
          icon={Plane}
          label="Annual leave"
          value={
            annualBalance ? `${annualBalance.remaining}/${annualBalance.entitled}` : "—"
          }
          delta={annualBalance ? `${annualBalance.used} used` : ""}
          accent="#3B82F6"
        />
        <MetricCard
          icon={Plane}
          label="Days off (approved)"
          value={String(totalDaysOff)}
          delta={`${leaveRequests.filter((l) => l.status === "pending").length} pending`}
          accent="#F59E0B"
        />
        <MetricCard
          icon={Wallet}
          label="Last net pay"
          value={payroll ? formatIDRCompact(payroll.netPay) : "—"}
          delta={payroll ? payroll.period : ""}
          accent="#22C55E"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {tab === "attendance" && `${attendance.length} records`}
            {tab === "leave" && `${leaveRequests.length} requests`}
            {tab === "payroll" && (payroll ? payroll.status : "no run")}
            {tab === "compensation" && `${salaryHistory.length} changes · ${allowances.length} allowances`}
            {tab === "history" && `${workHistory.length} jobs · ${education.length} schools · ${family.length} family`}
          </span>
        </div>

        {tab === "profile" ? (
          <ProfilePanel employee={employee} />
        ) : tab === "attendance" ? (
          <AttendanceList attendance={attendance} />
        ) : tab === "leave" ? (
          <LeavePanel requests={leaveRequests} balances={leaveBalances} />
        ) : tab === "payroll" ? (
          <PayrollPanel payroll={payroll} />
        ) : tab === "compensation" ? (
          <CompensationPanel
            salaryHistory={salaryHistory}
            allowances={allowances}
            currentSalary={employee.basicSalary}
          />
        ) : (
          <HistoryPanel
            family={family}
            education={education}
            workHistory={workHistory}
          />
        )}
      </div>
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "compensation", label: "Compensation" },
    { id: "history", label: "History" },
    { id: "attendance", label: "Attendance" },
    { id: "leave", label: "Leave" },
    { id: "payroll", label: "Payroll" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ProfilePanel({ employee }: { employee: Employee }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-3">
      <Field label="Employee #" value={employee.employeeNumber} />
      <Field label="Department" value={employee.department} />
      <Field label="Position" value={employee.position} />
      <Field label="Employment type" value={employee.employmentType} />
      <Field label="Join date" value={employee.joinDate} />
      <Field label="Manager" value={employee.managerName} />
      <Field label="Basic salary" value={formatIDRCompact(employee.basicSalary)} />
      <Field label="Bank account" value={employee.bankAccount} />
      <Field label="BPJS Kesehatan" value={employee.bpjsKes ? "Enrolled" : "—"} />
      <Field label="BPJS TK" value={employee.bpjsTk ? "Enrolled" : "—"} />
      <Field label="Email" value={employee.email} />
      <Field label="Phone" value={employee.phone} />
    </dl>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-xl border border-white/6 p-3">
      <dt className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-semibold text-zinc-100">{value}</dd>
    </div>
  );
}

function AttendanceList({
  attendance,
}: {
  attendance: typeof mockAttendance;
}) {
  if (attendance.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No attendance records.
      </div>
    );
  return (
    <ul className="space-y-1.5">
      {attendance.map((a) => (
        <li
          key={a.id}
          className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
        >
          <span className="col-span-3 font-mono text-[11px] text-zinc-200">{a.date}</span>
          <span className="col-span-2 text-[11px] text-zinc-300">{a.clockIn ?? "—"}</span>
          <span className="col-span-2 text-[11px] text-zinc-300">{a.clockOut ?? "—"}</span>
          <span className="col-span-2 text-right text-[11px] text-zinc-300">
            {a.overtimeHours ? `+${a.overtimeHours}h OT` : ""}
          </span>
          <span className="col-span-3 text-right">
            <StatusBadge tone={ATTENDANCE_TONE[a.status]} dot>
              {a.status}
            </StatusBadge>
          </span>
        </li>
      ))}
    </ul>
  );
}

function LeavePanel({
  requests,
  balances,
}: {
  requests: typeof mockLeaveRequests;
  balances: typeof mockLeaveBalances;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr,260px]">
      <div>
        <SectionHeader eyebrow="History" title={`Requests (${requests.length})`} />
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No leave requests on file.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {requests.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
              >
                <span className="col-span-2 text-[11px] text-zinc-200">{r.type}</span>
                <span className="col-span-4 text-[11px] text-zinc-300">
                  {r.startDate} → {r.endDate}
                </span>
                <span className="col-span-1 font-mono text-[11px] text-zinc-300">{r.days}d</span>
                <span className="col-span-3 truncate text-[11px] text-zinc-400">{r.reason}</span>
                <span className="col-span-2 text-right">
                  <StatusBadge tone={LEAVE_STATUS_TONE[r.status]}>{r.status}</StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <SectionHeader eyebrow="Balance" title="Available days" />
        <ul className="space-y-2 text-[11px]">
          {balances.map((b) => (
            <li key={b.type} className="rounded-xl border border-white/8 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-100">{b.type}</span>
                <span className="font-mono text-zinc-200">
                  {b.remaining} / {b.entitled}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${b.entitled > 0 ? (b.used / b.entitled) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #A21CAF, #FBCFE8)",
                  }}
                />
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">
                {b.used} days used
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PayrollPanel({ payroll }: { payroll: (typeof mockPayroll)[number] | null }) {
  if (!payroll)
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No payroll run for this employee yet.
      </div>
    );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="glass-soft rounded-xl border border-white/6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Period · {payroll.period}
          </span>
          <StatusBadge
            tone={
              payroll.status === "approved"
                ? "success"
                : payroll.status === "paid"
                  ? "info"
                  : "warning"
            }
          >
            {payroll.status}
          </StatusBadge>
        </div>
        <Line label="Basic salary" value={formatIDRCompact(payroll.basicSalary)} />
        <Line label="Allowances" value={formatIDRCompact(payroll.allowances)} />
        <Line label="Overtime" value={formatIDRCompact(payroll.overtime)} />
        <Line label="Gross" value={formatIDRCompact(payroll.gross)} emphasis />
      </div>
      <div className="glass-soft rounded-xl border border-white/6 p-4">
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Deductions</span>
        <div className="mt-3">
          <Line label="PPh 21" value={`-${formatIDRCompact(payroll.pph21)}`} tone="negative" />
          <Line
            label="BPJS Kes (1%)"
            value={`-${formatIDRCompact(payroll.bpjsKesEmployee)}`}
            tone="negative"
          />
          <Line
            label="BPJS TK (2%)"
            value={`-${formatIDRCompact(payroll.bpjsTkEmployee)}`}
            tone="negative"
          />
          <Line
            label="Other"
            value={`-${formatIDRCompact(payroll.otherDeductions)}`}
            tone="negative"
          />
          <Line
            label="Net pay"
            value={formatIDRCompact(payroll.netPay)}
            emphasis
            tone="positive"
          />
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  emphasis,
  tone = "neutral",
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "neutral" | "negative" | "positive";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-white/5 py-1.5 text-[11px] first:border-t-0",
        emphasis && "mt-1 border-t-2 border-white/10 pt-2",
      )}
    >
      <span className={cn("text-zinc-300", emphasis && "font-semibold text-zinc-100")}>{label}</span>
      <span
        className={cn(
          "font-mono",
          emphasis && "font-semibold",
          tone === "negative" && "text-rose-300",
          tone === "positive" && "text-emerald-300",
          tone === "neutral" && "text-zinc-100",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CompensationPanel({
  salaryHistory,
  allowances,
  currentSalary,
}: {
  salaryHistory: typeof mockSalaryHistory;
  allowances: typeof mockAllowances;
  currentSalary: number;
}) {
  const totalAllowances = allowances
    .filter((a) => a.status === "active")
    .reduce((s, a) => s + a.amount, 0);
  const totalComp = currentSalary + totalAllowances;
  const firstSalary = salaryHistory[salaryHistory.length - 1]?.amount ?? currentSalary;
  const growth = firstSalary > 0 ? ((currentSalary - firstSalary) / firstSalary) * 100 : 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          emphasis
          icon={Wallet}
          label="Current basic"
          value={formatIDRCompact(currentSalary)}
          trend="up"
        />
        <MetricCard
          label="Active allowances"
          value={formatIDRCompact(totalAllowances)}
          delta={`${allowances.filter((a) => a.status === "active").length} components`}
          accent="#3B82F6"
        />
        <MetricCard
          label="Total comp"
          value={formatIDRCompact(totalComp)}
          accent="#22C55E"
        />
        <MetricCard
          icon={TrendingUp}
          label="Growth since hire"
          value={`${growth.toFixed(0)}%`}
          trend={growth > 0 ? "up" : "flat"}
          accent="#F59E0B"
        />
      </div>

      <div>
        <SectionHeader
          eyebrow="Timeline"
          title={`Salary history (${salaryHistory.length})`}
          description="Every basic-salary change for this employee, newest first."
        />
        {salaryHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No salary changes recorded.
          </div>
        ) : (
          <ol className="space-y-2">
            {salaryHistory.map((s, i) => {
              const prev = salaryHistory[i + 1];
              const delta = prev ? s.amount - prev.amount : 0;
              const deltaPct = prev && prev.amount > 0 ? (delta / prev.amount) * 100 : 0;
              return (
                <li
                  key={s.id}
                  className="glass-soft grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 p-3"
                >
                  <span className="col-span-2 font-mono text-[10px] text-zinc-400">
                    {s.effectiveDate}
                  </span>
                  <span className="col-span-3">
                    <StatusBadge tone={i === 0 ? "success" : "neutral"}>
                      {s.reason}
                    </StatusBadge>
                  </span>
                  <span className="col-span-3 font-mono text-[12px] font-semibold text-zinc-50">
                    {formatIDRCompact(s.amount)}
                  </span>
                  <span
                    className={cn(
                      "col-span-2 font-mono text-[10px]",
                      delta > 0
                        ? "text-emerald-300"
                        : delta < 0
                          ? "text-rose-300"
                          : "text-zinc-500",
                    )}
                  >
                    {prev
                      ? `${delta >= 0 ? "+" : ""}${formatIDRCompact(Math.abs(delta))} (${deltaPct.toFixed(0)}%)`
                      : "—"}
                  </span>
                  <span className="col-span-2 truncate text-right text-[10px] text-zinc-400">
                    {s.notes ?? ""}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div>
        <SectionHeader
          eyebrow="Components"
          title={`Allowances (${allowances.length})`}
          description="Recurring allowance components attached to this employee."
        />
        {allowances.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No allowances attached.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {allowances.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
              >
                <span className="col-span-4 text-[11px] font-semibold text-zinc-100">
                  {a.componentName}
                </span>
                <span className="col-span-3 font-mono text-[11px] text-zinc-100">
                  {formatIDRCompact(a.amount)}
                </span>
                <span className="col-span-3 text-[10px] text-zinc-400">
                  effective {a.effectiveDate}
                </span>
                <span className="col-span-2 text-right">
                  <StatusBadge tone={a.status === "active" ? "success" : "neutral"} dot>
                    {a.status}
                  </StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HistoryPanel({
  family,
  education,
  workHistory,
}: {
  family: typeof mockFamilyMembers;
  education: typeof mockEducationHistories;
  workHistory: typeof mockWorkHistories;
}) {
  return (
    <div className="space-y-5">
      <div>
        <SectionHeader
          eyebrow="Career"
          title={`Work history (${workHistory.length})`}
          description="Past employment before joining WIT."
        />
        {workHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            First job at WIT.
          </div>
        ) : (
          <ol className="space-y-2">
            {workHistory.map((w) => (
              <li
                key={w.id}
                className="glass-soft flex items-start gap-3 rounded-xl border border-white/6 p-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5">
                  <Briefcase className="h-3.5 w-3.5 text-zinc-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-100">{w.position}</div>
                  <div className="text-[11px] text-zinc-300">{w.company}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {w.startDate} → {w.endDate ?? "Present"}
                    {w.reasonForLeaving ? ` · ${w.reasonForLeaving}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <SectionHeader
          eyebrow="Education"
          title={`Schools (${education.length})`}
          description="Formal education record."
        />
        {education.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No education on file.
          </div>
        ) : (
          <ul className="space-y-2">
            {education.map((e) => (
              <li
                key={e.id}
                className="glass-soft flex items-start gap-3 rounded-xl border border-white/6 p-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5">
                  <GraduationCap className="h-3.5 w-3.5 text-zinc-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="info">{e.level}</StatusBadge>
                    <span className="text-[11px] text-zinc-300">{e.major ?? "—"}</span>
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-zinc-100">{e.institution}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {e.startYear} → {e.endYear ?? "—"}
                    {e.gpa ? ` · GPA ${e.gpa.toFixed(2)}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <SectionHeader
          eyebrow="Family"
          title={`Family (${family.length})`}
          description="Dependents and emergency contacts."
        />
        {family.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No family on file.
          </div>
        ) : (
          <ul className="space-y-2">
            {family.map((f) => (
              <li
                key={f.id}
                className="glass-soft flex items-start gap-3 rounded-xl border border-white/6 p-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
                  <Heart className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100">{f.name}</span>
                    <StatusBadge tone="neutral">{f.relation}</StatusBadge>
                    {f.dependentForTax ? (
                      <StatusBadge tone="success" dot>
                        tax dependent
                      </StatusBadge>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[10px] text-zinc-400">
                    {f.birthDate ? `Born ${f.birthDate}` : ""}
                    {f.phone ? ` · ${f.phone}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

