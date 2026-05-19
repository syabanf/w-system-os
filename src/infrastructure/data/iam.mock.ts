import type { IAMRole, IAMPermission, IAMSession } from "@/domain/entities/IAM";
import { mockUsers } from "./users.mock";

export const mockRoles: IAMRole[] = [
  { id: "rl-001", name: "Super Admin", slug: "super-admin", description: "Full system access; can manage all roles and settings.", isSystem: true, userCount: mockUsers.filter((u) => u.role === "Super Admin").length, permissionCount: 142 },
  { id: "rl-002", name: "Director", slug: "director", description: "Executive view + approval rights on commercial + finance.", isSystem: true, userCount: mockUsers.filter((u) => u.role === "Director").length, permissionCount: 96 },
  { id: "rl-003", name: "Project Manager", slug: "project-manager", description: "Manage projects, sprints, tickets, team allocations.", isSystem: false, userCount: mockUsers.filter((u) => u.role === "Project Manager").length, permissionCount: 58 },
  { id: "rl-004", name: "Business Analyst", slug: "business-analyst", description: "Read access to delivery + write access to requirements.", isSystem: false, userCount: mockUsers.filter((u) => u.role === "Business Analyst").length, permissionCount: 42 },
  { id: "rl-005", name: "Developer", slug: "developer", description: "Engineering team — tasks, code reviews, time entries.", isSystem: false, userCount: mockUsers.filter((u) => u.role === "Developer").length, permissionCount: 36 },
  { id: "rl-006", name: "Finance", slug: "finance", description: "Manage invoices, payments, journals, AP/AR.", isSystem: false, userCount: mockUsers.filter((u) => u.role === "Finance").length, permissionCount: 68 },
  { id: "rl-007", name: "Sales", slug: "sales", description: "CRM, leads, proposals, contract drafting.", isSystem: false, userCount: mockUsers.filter((u) => u.role === "Sales").length, permissionCount: 44 },
  { id: "rl-008", name: "Client Viewer", slug: "client-viewer", description: "External read-only access for clients.", isSystem: false, userCount: mockUsers.filter((u) => u.role === "Client Viewer").length, permissionCount: 12 },
];

export const mockPermissions: IAMPermission[] = [
  { id: "pm-001", slug: "finance.invoice.create", module: "Finance", resource: "Invoice", action: "create", description: "Create new invoices for clients" },
  { id: "pm-002", slug: "finance.invoice.approve", module: "Finance", resource: "Invoice", action: "approve", description: "Approve invoices for posting" },
  { id: "pm-003", slug: "finance.journal.post", module: "Finance", resource: "Journal", action: "create", description: "Post manual journal entries to the GL" },
  { id: "pm-004", slug: "finance.journal.reverse", module: "Finance", resource: "Journal", action: "edit", description: "Reverse a previously posted journal" },
  { id: "pm-005", slug: "hr.payroll.run", module: "HR", resource: "Payroll", action: "approve", description: "Approve a monthly payroll run" },
  { id: "pm-006", slug: "hr.leave.approve", module: "HR", resource: "Leave", action: "approve", description: "Approve employee leave requests" },
  { id: "pm-007", slug: "projects.budget.edit", module: "Projects", resource: "Budget", action: "edit", description: "Adjust project budget allocations" },
  { id: "pm-008", slug: "support.ticket.assign", module: "Support", resource: "Ticket", action: "edit", description: "Assign tickets to engineers" },
  { id: "pm-009", slug: "iam.role.edit", module: "Admin", resource: "Role", action: "edit", description: "Edit role definitions + permissions" },
  { id: "pm-010", slug: "iam.user.delete", module: "Admin", resource: "User", action: "delete", description: "Deactivate or hard-delete user accounts" },
  { id: "pm-011", slug: "transaction.po.approve", module: "Transactions", resource: "PurchaseOrder", action: "approve", description: "Approve purchase orders above threshold" },
  { id: "pm-012", slug: "transaction.expense.approve", module: "Transactions", resource: "Expense", action: "approve", description: "Approve employee expense claims" },
  { id: "pm-013", slug: "crm.contract.sign", module: "CRM", resource: "Contract", action: "approve", description: "Sign off contracts ready for execution" },
  { id: "pm-014", slug: "reports.financial.export", module: "Reports", resource: "Financial", action: "export", description: "Export P&L, balance sheet, GL to PDF/Excel" },
];

export const mockSessions: IAMSession[] = [
  { id: "ss-001", userId: "u-001", device: "macOS · Chrome", ipAddress: "180.252.114.22", location: "Jakarta, ID", startedAt: "2026-05-19T08:42:00Z", lastSeenAt: "2026-05-19T09:00:00Z", active: true },
  { id: "ss-002", userId: "u-002", device: "macOS · Safari", ipAddress: "103.105.78.41", location: "Jakarta, ID", startedAt: "2026-05-19T08:55:00Z", lastSeenAt: "2026-05-19T08:59:00Z", active: true },
  { id: "ss-003", userId: "u-003", device: "Windows · Chrome", ipAddress: "180.252.114.22", location: "Jakarta, ID", startedAt: "2026-05-19T07:30:00Z", lastSeenAt: "2026-05-19T08:48:00Z", active: true },
  { id: "ss-004", userId: "u-004", device: "macOS · Chrome", ipAddress: "182.253.32.18", location: "Bandung, ID", startedAt: "2026-05-19T07:55:00Z", lastSeenAt: "2026-05-19T08:53:00Z", active: true },
  { id: "ss-005", userId: "u-005", device: "iOS · Safari", ipAddress: "182.253.32.18", location: "Bandung, ID", startedAt: "2026-05-19T08:10:00Z", lastSeenAt: "2026-05-19T08:34:00Z", active: true },
  { id: "ss-006", userId: "u-007", device: "Android · Chrome", ipAddress: "103.105.78.41", location: "Jakarta, ID", startedAt: "2026-05-19T08:00:00Z", lastSeenAt: "2026-05-19T08:20:00Z", active: true },
  { id: "ss-007", userId: "u-008", device: "macOS · Chrome", ipAddress: "180.252.114.41", location: "Jakarta, ID", startedAt: "2026-05-19T07:45:00Z", lastSeenAt: "2026-05-18T20:55:00Z", active: false },
  { id: "ss-008", userId: "u-009", device: "Linux · Firefox", ipAddress: "175.45.97.10", location: "Yogyakarta, ID", startedAt: "2026-04-30T08:00:00Z", lastSeenAt: "2026-04-30T17:23:00Z", active: false },
  { id: "ss-009", userId: "u-010", device: "macOS · Safari", ipAddress: "182.253.78.55", location: "Surabaya, ID", startedAt: "2026-05-19T08:33:00Z", lastSeenAt: "2026-05-19T08:55:00Z", active: true },
];
