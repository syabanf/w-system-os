"use client";

import type { UserAccount } from "@/domain/entities/User";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { BulkActionBar } from "@/presentation/shared/BulkActionBar";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUsersStore } from "@/state/users.store";
import { formatDateTime } from "@/lib/date";
import { Trash2 } from "lucide-react";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

const ROLE_OPTIONS: UserAccount["role"][] = [
  "Super Admin",
  "Director",
  "Project Manager",
  "Business Analyst",
  "Developer",
  "Finance",
  "Sales",
  "Client Viewer",
];

export function UserRoleTable({
  users,
  extraColumns = [],
}: {
  users: UserAccount[];
  extraColumns?: Column<UserAccount>[];
}) {
  const sel = useRowSelection();
  const updateUser = useUsersStore((s) => s.update);
  const removeUser = useUsersStore((s) => s.remove);

  const baseColumns: Column<UserAccount>[] = [
    {
      key: "user",
      header: "User",
      render: (u) => {
        const member = teamMap.get(u.memberId);
        return (
          <div className="flex items-center gap-2">
            {member ? (
              <Avatar name={member.name} initials={member.initials} color={member.avatarColor} size="sm" />
            ) : null}
            <div>
              <div className="text-xs font-semibold text-zinc-100">{member?.name ?? u.email}</div>
              <EditableCell
                value={u.email}
                type="text"
                onSave={(v) => updateUser(u.id, { email: v as string })}
                className="text-[10px] text-zinc-400"
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <EditableCell
          value={u.role}
          type="select"
          options={ROLE_OPTIONS}
          onSave={(v) => updateUser(u.id, { role: v as UserAccount["role"] })}
          displayRender={(v) => <StatusBadge tone="wit">{String(v)}</StatusBadge>}
        />
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (u) => (
        <StatusBadge tone={u.active ? "success" : "neutral"} dot>
          {u.active ? "Active" : "Disabled"}
        </StatusBadge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last login",
      render: (u) => <span className="text-[11px] text-zinc-300">{formatDateTime(u.lastLogin)}</span>,
    },
  ];

  return (
    <div className="space-y-2">
      <BulkActionBar
        count={sel.count}
        noun="user"
        onClear={sel.clear}
        actions={[
          {
            label: "Delete",
            icon: Trash2,
            tone: "danger",
            onClick: () => {
              [...sel.selectedIds].forEach((id) => removeUser(id));
              sel.clear();
            },
          },
          {
            label: "Deactivate",
            onClick: () => {
              [...sel.selectedIds].forEach((id) => updateUser(id, { active: false }));
              sel.clear();
            },
          },
        ]}
      />
      <DataTable<UserAccount>
        columns={[...baseColumns, ...extraColumns]}
        rows={users}
        rowKey={(u) => u.id}
        dense
        selectable
        selectedIds={sel.selectedIds}
        onToggleRow={sel.toggle}
        onToggleAll={sel.toggleAll}
      />
    </div>
  );
}
