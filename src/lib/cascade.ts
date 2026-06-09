import type { Project } from "@/domain/entities/Project";
import type { Invoice } from "@/domain/entities/Invoice";
import type { Epic } from "@/domain/entities/Epic";
import type { UserStory } from "@/domain/entities/UserStory";
import type { Task } from "@/domain/entities/Task";
import type { ProjectMilestone } from "@/domain/entities/ProjectMilestone";
import type { Sprint } from "@/domain/entities/Sprint";
import type { Payment } from "@/domain/entities/Transaction";
import { useProjectsStore } from "@/state/projects.store";
import { useInvoicesStore } from "@/state/invoices.store";
import { useEpicsStore } from "@/state/epics.store";
import { useUserStoriesStore } from "@/state/userStories.store";
import { useTasksStore } from "@/state/tasks.store";
import { useMilestonesStore } from "@/state/milestones.store";
import { useSprintsStore } from "@/state/sprints.store";
import { usePaymentsStore } from "@/state/payments.store";

/**
 * Cross-store referential cleanup. Stores are independent (no DB), so deleting
 * a parent leaves child records dangling unless we cascade explicitly. Each
 * helper collects a parent's children up-front (so a delete can be undone),
 * removes them, and restores them — keeping the dependent views in sync.
 */

const pluralize = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

// ── Project → work items (epics / stories / tasks / milestones / sprints) ─────
export interface ProjectChildren {
  epics: Epic[];
  stories: UserStory[];
  tasks: Task[];
  milestones: ProjectMilestone[];
  sprints: Sprint[];
}

export function collectProjectChildren(projectIds: Iterable<string>): ProjectChildren {
  const ids = new Set(projectIds);
  const within = <T extends { projectId: string }>(arr: T[]) =>
    arr.filter((x) => ids.has(x.projectId));
  return {
    epics: within(useEpicsStore.getState().items),
    stories: within(useUserStoriesStore.getState().items),
    tasks: within(useTasksStore.getState().items),
    milestones: within(useMilestonesStore.getState().items),
    sprints: within(useSprintsStore.getState().items),
  };
}

export function removeProjectChildren(c: ProjectChildren): void {
  c.epics.forEach((x) => useEpicsStore.getState().remove(x.id));
  c.stories.forEach((x) => useUserStoriesStore.getState().remove(x.id));
  c.tasks.forEach((x) => useTasksStore.getState().remove(x.id));
  c.milestones.forEach((x) => useMilestonesStore.getState().remove(x.id));
  c.sprints.forEach((x) => useSprintsStore.getState().remove(x.id));
}

export function restoreProjectChildren(c: ProjectChildren): void {
  if (c.epics.length) useEpicsStore.getState().restore(c.epics);
  if (c.stories.length) useUserStoriesStore.getState().restore(c.stories);
  if (c.tasks.length) useTasksStore.getState().restore(c.tasks);
  if (c.milestones.length) useMilestonesStore.getState().restore(c.milestones);
  if (c.sprints.length) useSprintsStore.getState().restore(c.sprints);
}

export function countProjectChildren(c: ProjectChildren): number {
  return c.epics.length + c.stories.length + c.tasks.length + c.milestones.length + c.sprints.length;
}

export function summarizeProjectChildren(c: ProjectChildren): string {
  const n = countProjectChildren(c);
  return n ? pluralize(n, "work item") : "";
}

// ── Invoice → payments ────────────────────────────────────────────────────────
export function collectInvoicePayments(invoiceId: string): Payment[] {
  return usePaymentsStore.getState().items.filter((p) => p.appliedToInvoiceId === invoiceId);
}

export function removePayments(payments: Payment[]): void {
  payments.forEach((p) => usePaymentsStore.getState().remove(p.id));
}

export function restorePayments(payments: Payment[]): void {
  if (payments.length) usePaymentsStore.getState().restore(payments);
}

export function summarizePayments(payments: Payment[]): string {
  return payments.length ? pluralize(payments.length, "payment") : "";
}

// ── Client → projects + invoices (+ each project's work items) ───────────────
export interface ClientChildren {
  projects: Project[];
  invoices: Invoice[];
  work: ProjectChildren;
}

export function collectClientChildren(clientId: string): ClientChildren {
  const projects = useProjectsStore.getState().items.filter((p) => p.clientId === clientId);
  const invoices = useInvoicesStore.getState().items.filter((i) => i.clientId === clientId);
  const work = collectProjectChildren(projects.map((p) => p.id));
  return { projects, invoices, work };
}

export function removeClientChildren(children: ClientChildren): void {
  children.projects.forEach((p) => useProjectsStore.getState().remove(p.id));
  children.invoices.forEach((i) => useInvoicesStore.getState().remove(i.id));
  removeProjectChildren(children.work);
}

export function restoreClientChildren(children: ClientChildren): void {
  if (children.projects.length) useProjectsStore.getState().restore(children.projects);
  if (children.invoices.length) useInvoicesStore.getState().restore(children.invoices);
  restoreProjectChildren(children.work);
}

/** Human summary like "2 projects · 3 invoices · 9 work items", or "". */
export function summarizeClientChildren(children: ClientChildren): string {
  const parts: string[] = [];
  if (children.projects.length) parts.push(pluralize(children.projects.length, "project"));
  if (children.invoices.length) parts.push(pluralize(children.invoices.length, "invoice"));
  const w = countProjectChildren(children.work);
  if (w) parts.push(pluralize(w, "work item"));
  return parts.join(" · ");
}
