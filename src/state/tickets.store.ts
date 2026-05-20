"use client";

import { mockTickets } from "@/infrastructure/data/tickets.mock";
import type { Ticket } from "@/domain/entities/Ticket";
import { SLA_HOURS_BY_SEVERITY } from "@/domain/value-objects/TicketSeverity";
import { createCRUDStore } from "./createCRUDStore";

export type TicketDraft = Omit<Ticket, "id" | "code" | "createdAt" | "slaDeadline"> & {
  /** Optional overrides — auto-computed when omitted. */
  code?: string;
  createdAt?: string;
  slaDeadline?: string;
};

let codeCounter = mockTickets.length;
const nextCode = () => {
  codeCounter += 1;
  return `T-${String(codeCounter).padStart(4, "0")}`;
};

export const useTicketsStore = createCRUDStore<Ticket, TicketDraft>({
  storageKey: "wit-erp-os.tickets",
  seed: mockTickets,
  idPrefix: "tk",
  fromDraft: (draft, { id }) => {
    const createdAt = draft.createdAt ?? new Date().toISOString();
    const slaHours = SLA_HOURS_BY_SEVERITY[draft.severity];
    const slaDeadline =
      draft.slaDeadline ?? new Date(new Date(createdAt).getTime() + slaHours * 3600_000).toISOString();
    return {
      ...draft,
      id,
      code: draft.code ?? nextCode(),
      createdAt,
      slaDeadline,
    };
  },
});
