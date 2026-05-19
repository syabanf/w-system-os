import type { ID, ISODate } from "@/types/common";
import type { TicketSeverity, TicketStatus } from "../value-objects/TicketSeverity";

export interface Ticket {
  id: ID;
  code: string;
  title: string;
  clientId: ID;
  projectId: ID;
  severity: TicketSeverity;
  status: TicketStatus;
  assignedToId: ID;
  createdAt: ISODate;
  slaDeadline: ISODate;
  isChangeRequest: boolean;
  estimatedEffortHours?: number;
}
