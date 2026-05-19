import type { Client } from "@/domain/entities/Client";

export const ClientMapper = {
  fromRaw(raw: unknown): Client {
    return raw as Client;
  },
  toRaw(client: Client): unknown {
    return client;
  },
};
