"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, IdCard, Users, Wallet } from "lucide-react";
import { createHRService } from "@/application/factories/createHRService";
import type { HROverviewDTO } from "@/application/use-cases/hr/GetHROverview";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { ChartCard } from "@/presentation/shared/ChartCard";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { Avatar } from "@/presentation/shared/Avatar";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { AttendanceChart } from "./AttendanceChart";
import { EmployeeDetailView } from "./EmployeeDetailView";
import { EmployeeFormDialog } from "./EmployeeFormDialog";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { NewButton } from "@/presentation/shared/NewButton";
import { ResourceManagementView } from "@/presentation/modules/resources/ResourceManagementView";
import { ContractProposalView } from "@/presentation/modules/contracts/ContractProposalView";
import { type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { DrillHeader } from "@/presentation/shared/DrillHeader";
import { DrillCue } from "@/presentation/shared/DrillCue";
import { useDrillState } from "@/state/drill.store";
import { useEmployeesStore } from "@/state/employees.store";
import type { Employee } from "@/domain/entities/Employee";
import { Pencil, Trash2 } from "lucide-react";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionBar } from "@/presentation/shared/BulkActionBar";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { useToast } from "@/state/toast.store";

type Tab = "people" | "attendance" | "leave" | "payroll" | "capacity" | "contracts";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function HRView() {
  const [data, setData] = useState<HROverviewDTO | null>(null);
  const [tab, setTab] = useState<Tab>("people");
  const storeEmployees = useEmployeesStore((s) => s.employees);
  const hydrate = useEmployeesStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    let cancelled = false;
    (async () => {
      const d = await createHRService().getOverview();
      if (!cancelled) setData(d);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  if (!data) return <SkeletonLoadingView />;

  // Live headcount from the store so adds/deletes update the metric immediately.
  const liveHeadcount = storeEmployees.length;
  const liveActive = storeEmployees.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Operations · HR
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            People operations
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Workforce overview, attendance pulse, leave pipeline, and the current payroll run.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <ManageMasterDataButton moduleId="hr" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Users}
          label="Headcount"
          value={String(liveHeadcount)}
          delta={`${liveActive} active`}
          trend="up"
        />
        <MetricCard
          icon={IdCard}
          label="New Hires (Q)"
          value={String(data.newHiresThisQuarter)}
          accent="#3B82F6"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Attendance"
          value={formatPercent(data.attendance.presentRate + data.attendance.leaveRate * 0 + 0, 1)}
          delta={`${formatPercent(data.attendance.lateRate, 1)} late`}
          trend={data.attendance.presentRate > 90 ? "up" : "down"}
          accent="#22C55E"
        />
        <MetricCard
          icon={Wallet}
          label={`Payroll · ${data.payroll.period}`}
          value={formatIDRCompact(data.payroll.totalNet)}
          delta={`gross ${formatIDRCompact(data.payroll.totalGross)}`}
          accent="#FBBF24"
        />
      </div>

      {tab === "people" && <PeopleTab data={data} />}{/* drill handled inside */}
      {tab === "attendance" && <AttendanceTab data={data} />}
      {tab === "leave" && <LeaveTab data={data} />}
      {tab === "payroll" && <PayrollTab data={data} />}
      {tab === "capacity" && <ResourceManagementView compact />}
      {tab === "contracts" && <ContractProposalView compact />}
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: "people", label: "People" },
    { id: "attendance", label: "Attendance" },
    { id: "leave", label: "Leave" },
    { id: "payroll", label: "Payroll" },
    { id: "capacity", label: "Capacity" },
    { id: "contracts", label: "Contracts" },
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

function PeopleTab({ data }: { data: HROverviewDTO }) {
  const employees = useEmployeesStore((s) => s.employees);
  const hydrate = useEmployeesStore((s) => s.hydrate);
  const addEmployee = useEmployeesStore((s) => s.add);
  const updateEmployee = useEmployeesStore((s) => s.update);
  const removeEmployee = useEmployeesStore((s) => s.remove);
  const toast = useToast();
  const sel = useRowSelection();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const [drillId, setDrillId] = useDrillState("hr");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  const drillEmp = drillId ? employees.find((e) => e.id === drillId) ?? null : null;
  const crumbs: Crumb[] = drillEmp
    ? [
        { id: "roster", label: "Roster" },
        { id: drillEmp.id, label: `${drillEmp.firstName} ${drillEmp.lastName}`, sublabel: drillEmp.employeeNumber },
      ]
    : [{ id: "roster", label: "Roster" }];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setFormOpen(true);
  };

  const empColumns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      render: (e) => {
        const member = teamMap.get(e.memberId);
        return (
          <div className="flex items-center gap-2">
            {member ? (
              <Avatar name={member.name} initials={member.initials} color={member.avatarColor} size="sm" />
            ) : (
              <Avatar name={`${e.firstName} ${e.lastName}`} size="sm" />
            )}
            <div>
              <div className="text-xs font-semibold text-zinc-100">{e.firstName} {e.lastName}</div>
              <div className="text-[10px] text-zinc-400">{e.employeeNumber} · {e.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "dept",
      header: "Department",
      render: (e) => (
        <EditableCell
          value={e.department}
          type="text"
          displayClassName="text-[11px] text-zinc-300"
          onSave={(v) => updateEmployee(e.id, { department: v as string })}
        />
      ),
    },
    {
      key: "role",
      header: "Position",
      render: (e) => (
        <EditableCell
          value={e.position}
          type="text"
          displayClassName="text-[11px] text-zinc-300"
          onSave={(v) => updateEmployee(e.id, { position: v as string })}
        />
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (e) => (
        <EditableCell
          value={e.employmentType}
          type="select"
          options={["Permanent", "Contract", "Probation", "Intern"]}
          onSave={(v) => updateEmployee(e.id, { employmentType: v as Employee["employmentType"] })}
          displayRender={(v) => <StatusBadge tone="wit">{v as string}</StatusBadge>}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <EditableCell
          value={e.status}
          type="select"
          options={["active", "probation", "on-leave", "resigned", "terminated"]}
          onSave={(v) => updateEmployee(e.id, { status: v as Employee["status"] })}
          displayRender={(v) => (
            <StatusBadge
              tone={
                v === "active" ? "success" :
                v === "on-leave" ? "warning" :
                v === "probation" ? "info" : "neutral"
              }
              dot
            >
              {v as string}
            </StatusBadge>
          )}
        />
      ),
    },
    {
      key: "join",
      header: "Joined",
      render: (e) => <span className="text-[11px] text-zinc-400">{e.joinDate}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <span
            className="group mr-1 inline-flex"
            role="button"
            aria-label={`Open ${e.firstName} ${e.lastName}`}
          >
            <DrillCue label="Open" />
          </span>
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e);
            }}
            aria-label={`Edit ${e.firstName} ${e.lastName}`}
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setConfirmDelete(e);
            }}
            aria-label={`Delete ${e.firstName} ${e.lastName}`}
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ];

  if (drillEmp) {
    return (
      <div className="space-y-4">
        <DrillHeader
          crumbs={crumbs}
          onJump={(i) => i === 0 && setDrillId(null)}
          onBack={() => setDrillId(null)}
          backLabel="Back to people"
          ariaLabel="Employee drill-down"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(drillEmp)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-zinc-100 transition-colors hover:bg-white/15"
          >
            <Pencil className="h-3 w-3" />
            Edit profile
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(drillEmp)}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
        <EmployeeDetailView employee={drillEmp} />
        <EmployeeFormDialog
          open={formOpen}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={(draft, editingId) => {
            if (editingId) {
              updateEmployee(editingId, draft);
              toast.success("Employee updated", `${draft.firstName} ${draft.lastName} · ${draft.position}`);
            } else {
              addEmployee(draft);
              toast.success("Employee added", `${draft.firstName} ${draft.lastName} joined ${draft.department}`);
            }
          }}
        />
        <DeleteConfirmDialog
          employee={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={(id) => {
            const name = confirmDelete ? `${confirmDelete.firstName} ${confirmDelete.lastName}` : "Employee";
            removeEmployee(id);
            setConfirmDelete(null);
            setDrillId(null);
            toast.info("Employee removed", `${name} has been archived.`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Roster"
          title={`Employees (${employees.length})`}
          description="Click a row to drill in; use the actions column to edit or remove."
          action={<NewButton label="New employee" onClick={openCreate} />}
        />
        <BulkActionBar
          count={sel.count}
          noun="employee"
          onClear={sel.clear}
          actions={[
            {
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onClick: () => {
                [...sel.selectedIds].forEach((id) => removeEmployee(id));
                sel.clear();
              },
            },
            {
              label: "Set on leave",
              onClick: () => {
                [...sel.selectedIds].forEach((id) => updateEmployee(id, { status: "on-leave" }));
                sel.clear();
              },
            },
          ]}
        />
        <DataTable
          rows={employees}
          columns={empColumns}
          rowKey={(e) => e.id}
          onRowClick={(e) => setDrillId(e.id)}
          selectable
          selectedIds={sel.selectedIds}
          onToggleRow={sel.toggle}
          onToggleAll={sel.toggleAll}
          dense
        />
      </div>
      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Distribution" title="By department" />
        <ul className="space-y-1.5">
          {data.byDepartment.map((d) => (
            <li key={d.department} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]">
              <span className="w-32 truncate text-[11px] text-zinc-200">{d.department}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${(d.count / data.headcount) * 100}%`,
                    background: "linear-gradient(90deg, #A21CAF, #FBCFE8)",
                  }}
                />
              </div>
              <span className="w-6 text-right font-mono text-[10px] text-zinc-300">{d.count}</span>
            </li>
          ))}
        </ul>
        <SectionHeader className="mt-5" eyebrow="Type" title="Employment mix" />
        <ul className="space-y-1">
          {data.byEmploymentType.map((t) => (
            <li key={t.type} className="flex items-center justify-between rounded-lg px-2 py-1 text-[11px]">
              <span className="text-zinc-300">{t.type}</span>
              <span className="font-mono text-zinc-200">{t.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <EmployeeFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateEmployee(editingId, draft);
            toast.success("Employee updated", `${draft.firstName} ${draft.lastName} · ${draft.position}`);
          } else {
            addEmployee(draft);
            toast.success("Employee added", `${draft.firstName} ${draft.lastName} joined ${draft.department}`);
          }
        }}
      />
      <DeleteConfirmDialog
        employee={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={(id) => {
          const name = confirmDelete ? `${confirmDelete.firstName} ${confirmDelete.lastName}` : "Employee";
          removeEmployee(id);
          setConfirmDelete(null);
          toast.info("Employee removed", `${name} has been archived.`);
        }}
      />
    </div>
  );
}

function DeleteConfirmDialog({
  employee,
  onCancel,
  onConfirm,
}: {
  employee: Employee | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!employee) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-sm overflow-hidden rounded-2xl border border-white/12 p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-zinc-50">Remove employee?</div>
            <p className="mt-1 text-[11px] text-zinc-400">
              {employee.firstName} {employee.lastName} ({employee.employeeNumber}) will be
              removed from the roster. This affects HR view only — historical attendance /
              leave / payroll records remain orphaned for now.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/8 hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(employee.id)}
            className="rounded-full bg-rose-500/80 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ data }: { data: HROverviewDTO }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        className="xl:col-span-2"
        title="Attendance — current week"
        description="Daily breakdown across Present / Late / Remote / Leave / Absent."
        height={260}
      >
        <AttendanceChart series={data.attendance.daySeries} />
      </ChartCard>
      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Pulse" title="Week metrics" />
        <ul className="space-y-1.5 text-[11px]">
          <li className="flex justify-between rounded-lg px-2 py-1.5 text-zinc-200">
            <span>Records logged</span>
            <span className="font-mono text-zinc-50">{data.attendance.totalRecords}</span>
          </li>
          <li className="flex justify-between rounded-lg px-2 py-1.5 text-zinc-200">
            <span>Present rate</span>
            <span className="font-mono text-emerald-300">{formatPercent(data.attendance.presentRate, 1)}</span>
          </li>
          <li className="flex justify-between rounded-lg px-2 py-1.5 text-zinc-200">
            <span>Late rate</span>
            <span className="font-mono text-amber-300">{formatPercent(data.attendance.lateRate, 1)}</span>
          </li>
          <li className="flex justify-between rounded-lg px-2 py-1.5 text-zinc-200">
            <span>Leave rate</span>
            <span className="font-mono text-sky-300">{formatPercent(data.attendance.leaveRate, 1)}</span>
          </li>
          <li className="flex justify-between rounded-lg px-2 py-1.5 text-zinc-200">
            <span>Overtime hours</span>
            <span className="font-mono text-zinc-50">{data.attendance.overtimeHours}h</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function LeaveTab({ data }: { data: HROverviewDTO }) {
  const reqColumns: Column<typeof data.leave.upcoming[number]>[] = [
    { key: "emp", header: "Employee", render: (r) => <span className="text-xs">{r.employeeName}</span> },
    { key: "type", header: "Type", render: (r) => <StatusBadge tone="wit">{r.type}</StatusBadge> },
    { key: "from", header: "From", render: (r) => <span className="text-[11px] text-zinc-300">{r.startDate}</span> },
    { key: "to", header: "To", render: (r) => <span className="text-[11px] text-zinc-300">{r.endDate}</span> },
    { key: "days", header: "Days", align: "right", render: (r) => <span className="font-mono text-xs">{r.days}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge tone={r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "neutral"}>
          {r.status}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Schedule"
          title="Upcoming & pending leave"
          description={`${data.leave.pendingRequests.length} pending · ${data.leave.approvedThisMonth} approved this month`}
        />
        <DataTable rows={data.leave.upcoming} columns={reqColumns} rowKey={(r) => r.id} dense />
      </div>
      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Pool" title="Leave balances" description="Aggregated days across all employees." />
        <ul className="space-y-2 text-[11px]">
          {data.leave.balanceByType.map((b) => (
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

function PayrollTab({ data }: { data: HROverviewDTO }) {
  type Row = typeof data.payroll.items[number];
  const cols: Column<Row>[] = [
    {
      key: "emp",
      header: "Employee",
      render: (r) => (
        <div>
          <div className="text-xs font-semibold text-zinc-100">{r.employeeName}</div>
          <div className="text-[10px] text-zinc-400">{r.department} · {r.position}</div>
        </div>
      ),
    },
    { key: "basic", header: "Basic", align: "right", render: (r) => <span className="font-mono text-xs">{formatIDRCompact(r.basicSalary)}</span> },
    { key: "allow", header: "Allowance", align: "right", render: (r) => <span className="font-mono text-xs text-zinc-300">{formatIDRCompact(r.allowances)}</span> },
    { key: "gross", header: "Gross", align: "right", render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDRCompact(r.gross)}</span> },
    { key: "pph", header: "PPh 21", align: "right", render: (r) => <span className="font-mono text-xs text-rose-300">-{formatIDRCompact(r.pph21)}</span> },
    { key: "bpjs", header: "BPJS", align: "right", render: (r) => <span className="font-mono text-xs text-rose-300">-{formatIDRCompact(r.bpjsKesEmployee + r.bpjsTkEmployee)}</span> },
    { key: "net", header: "Net pay", align: "right", render: (r) => <span className="font-mono text-xs font-semibold text-emerald-300">{formatIDRCompact(r.netPay)}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge tone={r.status === "approved" ? "success" : r.status === "paid" ? "info" : "warning"}>
          {r.status}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Total gross" value={formatIDRCompact(data.payroll.totalGross)} accent="#FBBF24" />
        <MetricCard label="Total net" value={formatIDRCompact(data.payroll.totalNet)} accent="#22C55E" />
        <MetricCard label="PPh 21 withheld" value={formatIDRCompact(data.payroll.totalPph21)} accent="#EF4444" />
        <MetricCard label="BPJS employee share" value={formatIDRCompact(data.payroll.totalBpjs)} accent="#3B82F6" />
      </div>
      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow={`Run · ${data.payroll.period}`}
          title="Payroll register"
          description={`${data.payroll.items.length} payslips · ${data.payroll.draftCount} draft`}
        />
        <DataTable rows={data.payroll.items} columns={cols} rowKey={(r) => r.id} dense />
      </div>
    </div>
  );
}
