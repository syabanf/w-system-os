"use client";

import { useState } from "react";
import { History, KeyRound, ShieldCheck, UserCheck, Users } from "lucide-react";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { Avatar } from "@/presentation/shared/Avatar";
import { UserRoleTable } from "./UserRoleTable";
import { AuditLogPanel } from "./AuditLogPanel";
import { mockUsers, mockAuditLog } from "@/infrastructure/data/users.mock";
import { mockRoles, mockPermissions, mockSessions } from "@/infrastructure/data/iam.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import type { IAMPermission, IAMRole, IAMSession } from "@/domain/entities/IAM";
import { cn } from "@/lib/cn";
import { relativeFromNow } from "@/lib/date";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

type Tab = "users" | "roles" | "permissions" | "sessions" | "audit";

const memberByUserId = new Map(
  mockUsers.map((u) => [u.id, mockTeam.find((m) => m.id === u.memberId)]),
);

const ACTION_TONE: Record<IAMPermission["action"], "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  view: "neutral",
  create: "info",
  edit: "warning",
  delete: "danger",
  approve: "success",
  export: "wit",
};

export function AdminAccessView() {
  const [tab, setTab] = useState<Tab>("users");
  const active = mockUsers.filter((u) => u.active).length;
  const activeSessions = mockSessions.filter((s) => s.active).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            System · Identity & Access
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Access control
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Users, roles, granular permissions, live sessions, and the audit trail. The foundation
            other modules check against.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <ManageMasterDataButton moduleId="admin" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard emphasis icon={Users} label="Accounts" value={String(mockUsers.length)} delta={`${active} active`} trend="up" />
        <MetricCard icon={ShieldCheck} label="Roles" value={String(mockRoles.length)} accent="#3B82F6" />
        <MetricCard icon={KeyRound} label="Permissions" value={String(mockPermissions.length)} accent="#A855F7" />
        <MetricCard icon={UserCheck} label="Active Sessions" value={String(activeSessions)} delta={`${mockSessions.length} total`} accent="#22C55E" />
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "permissions" && <PermissionsTab />}
      {tab === "sessions" && <SessionsTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles", icon: ShieldCheck },
    { id: "permissions", label: "Permissions", icon: KeyRound },
    { id: "sessions", label: "Sessions", icon: UserCheck },
    { id: "audit", label: "Audit", icon: History },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors",
              tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            <Icon className="h-3 w-3" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function UsersTab() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr,320px]">
      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Users" title={`Accounts (${mockUsers.length})`} />
        <UserRoleTable users={mockUsers} />
      </div>
      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Distribution" title="By role" />
        <ul className="space-y-1.5">
          {mockRoles.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
            >
              <span className="w-32 truncate text-[11px] text-zinc-200">{r.name}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${(r.userCount / Math.max(1, mockUsers.length)) * 100}%`,
                    background: "linear-gradient(90deg, #FAFAF9, #71717A)",
                  }}
                />
              </div>
              <span className="w-6 text-right font-mono text-[10px] text-zinc-300">{r.userCount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RolesTab() {
  const cols: Column<IAMRole>[] = [
    {
      key: "role",
      header: "Role",
      render: (r) => (
        <div>
          <div className="text-xs font-semibold text-zinc-100">{r.name}</div>
          <div className="font-mono text-[10px] text-zinc-400">{r.slug}</div>
        </div>
      ),
    },
    { key: "desc", header: "Description", render: (r) => <span className="text-[11px] text-zinc-300">{r.description}</span> },
    { key: "users", header: "Users", align: "right", render: (r) => <span className="font-mono text-xs">{r.userCount}</span> },
    { key: "perms", header: "Permissions", align: "right", render: (r) => <span className="font-mono text-xs">{r.permissionCount}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <StatusBadge tone={r.isSystem ? "wit" : "neutral"}>{r.isSystem ? "system" : "custom"}</StatusBadge>
      ),
    },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader eyebrow="RBAC" title={`Roles (${mockRoles.length})`} />
      <DataTable rows={mockRoles} columns={cols} rowKey={(r) => r.id} dense />
    </div>
  );
}

function PermissionsTab() {
  const grouped = mockPermissions.reduce<Record<string, IAMPermission[]>>((acc, p) => {
    acc[p.module] = acc[p.module] ?? [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module} className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow={module} title={`${perms.length} permissions`} />
          <ul className="space-y-1.5">
            {perms.map((p) => (
              <li
                key={p.id}
                className="glass-soft rounded-xl border border-white/6 p-3 text-[11px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-zinc-100">{p.slug}</span>
                  <StatusBadge tone={ACTION_TONE[p.action]}>{p.action}</StatusBadge>
                </div>
                <div className="mt-1 text-zinc-400">{p.description}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SessionsTab() {
  const cols: Column<IAMSession>[] = [
    {
      key: "user",
      header: "User",
      render: (s) => {
        const user = mockUsers.find((u) => u.id === s.userId);
        const member = memberByUserId.get(s.userId);
        return (
          <div className="flex items-center gap-2">
            {member ? (
              <Avatar name={member.name} initials={member.initials} color={member.avatarColor} size="sm" />
            ) : null}
            <div>
              <div className="text-xs font-semibold text-zinc-100">{member?.name ?? user?.email ?? "Unknown"}</div>
              <div className="text-[10px] text-zinc-400">{user?.email}</div>
            </div>
          </div>
        );
      },
    },
    { key: "device", header: "Device", render: (s) => <span className="text-[11px] text-zinc-300">{s.device}</span> },
    { key: "ip", header: "IP", render: (s) => <span className="font-mono text-[11px] text-zinc-400">{s.ipAddress}</span> },
    { key: "loc", header: "Location", render: (s) => <span className="text-[11px] text-zinc-300">{s.location}</span> },
    { key: "started", header: "Started", render: (s) => <span className="text-[11px] text-zinc-400">{relativeFromNow(s.startedAt)}</span> },
    { key: "seen", header: "Last seen", render: (s) => <span className="text-[11px] text-zinc-300">{relativeFromNow(s.lastSeenAt)}</span> },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge tone={s.active ? "success" : "neutral"} dot>{s.active ? "active" : "ended"}</StatusBadge>,
    },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader eyebrow="Live" title={`Sessions (${mockSessions.length})`} description="Token-backed sessions across the workforce." />
      <DataTable rows={mockSessions} columns={cols} rowKey={(s) => s.id} dense />
    </div>
  );
}

function AuditTab() {
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader eyebrow="Audit" title="Recent activity" description="Every operator action across the operating system." />
      <AuditLogPanel entries={mockAuditLog} />
    </div>
  );
}
