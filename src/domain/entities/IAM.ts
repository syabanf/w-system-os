import type { ID, ISODate } from "@/types/common";

export interface IAMRole {
  id: ID;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
}

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

export interface IAMPermission {
  id: ID;
  slug: string; // e.g. "finance.invoice.create"
  module: string;
  resource: string;
  action: PermissionAction;
  description: string;
}

export type SessionDevice = "macOS · Chrome" | "macOS · Safari" | "Windows · Chrome" | "iOS · Safari" | "Android · Chrome" | "Linux · Firefox";

export interface IAMSession {
  id: ID;
  userId: ID;
  device: SessionDevice;
  ipAddress: string;
  location: string;
  startedAt: ISODate;
  lastSeenAt: ISODate;
  active: boolean;
}
