import type { Ticket } from "../entities/Ticket";
import { demoNow } from "@/lib/date";

export function isSLABreached(ticket: Ticket, asOf: Date = demoNow()): boolean {
  if (ticket.status === "Resolved" || ticket.status === "Closed") return false;
  return new Date(ticket.slaDeadline).getTime() < asOf.getTime();
}

export function isSLAAtRisk(ticket: Ticket, asOf: Date = demoNow()): boolean {
  if (ticket.status === "Resolved" || ticket.status === "Closed") return false;
  const deadline = new Date(ticket.slaDeadline).getTime();
  const hoursLeft = (deadline - asOf.getTime()) / (1000 * 60 * 60);
  return hoursLeft > 0 && hoursLeft < 4;
}

export function hoursUntilSLA(ticket: Ticket, asOf: Date = demoNow()): number {
  const deadline = new Date(ticket.slaDeadline).getTime();
  return (deadline - asOf.getTime()) / (1000 * 60 * 60);
}
