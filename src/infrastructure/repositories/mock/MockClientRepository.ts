import type { ClientRepository } from "@/domain/repositories/ClientRepository";
import type { Client } from "@/domain/entities/Client";
import { mockClients } from "@/infrastructure/data/clients.mock";

export class MockClientRepository implements ClientRepository {
  async getAll(): Promise<Client[]> {
    return mockClients;
  }
  async getById(id: string): Promise<Client | null> {
    return mockClients.find((c) => c.id === id) ?? null;
  }
}
