import type { ID, ISODate } from "@/types/common";

export type Role =
  | "Super Admin"
  | "Director"
  | "Project Manager"
  | "Business Analyst"
  | "Developer"
  | "Finance"
  | "Sales"
  | "Client Viewer";

export interface UserAccount {
  id: ID;
  memberId: ID;
  email: string;
  role: Role;
  active: boolean;
  lastLogin: ISODate;
}

export interface AuditLogEntry {
  id: ID;
  actorId: ID;
  action: string;
  target: string;
  at: ISODate;
}
