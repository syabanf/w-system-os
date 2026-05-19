"use client";

import type { UserAccount } from "@/domain/entities/User";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { formatDateTime } from "@/lib/date";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function UserRoleTable({ users }: { users: UserAccount[] }) {
  const columns: Column<UserAccount>[] = [
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
              <div className="text-[10px] text-zinc-400">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <StatusBadge tone="wit">{u.role}</StatusBadge>,
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

  return <DataTable<UserAccount> columns={columns} rows={users} rowKey={(u) => u.id} dense />;
}
