import type { Client } from "../entities/Client";

export interface ClientRepository {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
}
