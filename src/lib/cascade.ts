import type { Project } from "@/domain/entities/Project";
import type { Invoice } from "@/domain/entities/Invoice";
import { useProjectsStore } from "@/state/projects.store";
import { useInvoicesStore } from "@/state/invoices.store";

/**
 * Cross-store referential cleanup. Stores are independent (no DB), so deleting
 * a parent leaves child records dangling unless we cascade explicitly. These
 * helpers collect a client's children up-front (so a delete can be undone),
 * remove them, and restore them — keeping the Projects / Finance views in sync
 * with the Clients module.
 */
export interface ClientChildren {
  projects: Project[];
  invoices: Invoice[];
}

export function collectClientChildren(clientId: string): ClientChildren {
  return {
    projects: useProjectsStore.getState().items.filter((p) => p.clientId === clientId),
    invoices: useInvoicesStore.getState().items.filter((i) => i.clientId === clientId),
  };
}

export function removeClientChildren(children: ClientChildren): void {
  const projects = useProjectsStore.getState();
  children.projects.forEach((p) => projects.remove(p.id));
  const invoices = useInvoicesStore.getState();
  children.invoices.forEach((i) => invoices.remove(i.id));
}

export function restoreClientChildren(children: ClientChildren): void {
  if (children.projects.length) useProjectsStore.getState().restore(children.projects);
  if (children.invoices.length) useInvoicesStore.getState().restore(children.invoices);
}

/** Human summary like "2 projects · 3 invoices", or "" when there are none. */
export function summarizeClientChildren(children: ClientChildren): string {
  const parts: string[] = [];
  if (children.projects.length)
    parts.push(`${children.projects.length} project${children.projects.length === 1 ? "" : "s"}`);
  if (children.invoices.length)
    parts.push(`${children.invoices.length} invoice${children.invoices.length === 1 ? "" : "s"}`);
  return parts.join(" · ");
}
