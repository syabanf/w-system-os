import type { TicketRepository } from "@/domain/repositories/TicketRepository";
import type { Ticket } from "@/domain/entities/Ticket";
import { mockTickets } from "@/infrastructure/data/tickets.mock";
import { isSLABreached } from "@/domain/rules/sla.rules";

const NOW = new Date("2026-05-18T09:00:00Z");

export class MockTicketRepository implements TicketRepository {
  async getAll(): Promise<Ticket[]> {
    return mockTickets;
  }
  async getById(id: string): Promise<Ticket | null> {
    return mockTickets.find((t) => t.id === id) ?? null;
  }
  async getOpenTickets(): Promise<Ticket[]> {
    return mockTickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed");
  }
  async getSLABreached(asOf: Date = NOW): Promise<Ticket[]> {
    return mockTickets.filter((t) => isSLABreached(t, asOf));
  }
}
