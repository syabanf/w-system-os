export type TicketSeverity = "low" | "medium" | "high" | "critical";

export type TicketStatus =
  | "Open"
  | "Investigating"
  | "Waiting Client"
  | "In Progress"
  | "Resolved"
  | "Closed";

export const TICKET_STATUSES: TicketStatus[] = [
  "Open",
  "Investigating",
  "Waiting Client",
  "In Progress",
  "Resolved",
  "Closed",
];

export const SLA_HOURS_BY_SEVERITY: Record<TicketSeverity, number> = {
  critical: 4,
  high: 12,
  medium: 24,
  low: 72,
};
