import type { Ticket } from "../entities/Ticket";

export interface TicketRepository {
  getAll(): Promise<Ticket[]>;
  getById(id: string): Promise<Ticket | null>;
  getOpenTickets(): Promise<Ticket[]>;
  getSLABreached(asOf?: Date): Promise<Ticket[]>;
}
