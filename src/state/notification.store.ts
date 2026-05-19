"use client";

import { create } from "zustand";

export type NotificationKind = "deadline" | "invoice" | "blocker" | "approval" | "follow-up" | "sla";

export interface DesktopNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  appHint?: string;
  read?: boolean;
}

export type NotificationFilter = "all" | "unread" | NotificationKind;

interface NotificationState {
  notifications: DesktopNotification[];
  unread: number;
  filter: NotificationFilter;
  setFilter: (f: NotificationFilter) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  push: (n: Omit<DesktopNotification, "id" | "at" | "read">) => string;
}

const DEFAULTS: DesktopNotification[] = [
  { id: "n-001", kind: "sla", title: "SLA breach — GRD-T-1024", body: "Critical P0 incident exceeded SLA by 7 hours.", at: "2026-05-18T08:18:00Z", appHint: "Support" },
  { id: "n-002", kind: "invoice", title: "Invoice overdue — INV-2026-0034", body: "Cendrawasih Logistics — IDR 195M, 27 days overdue.", at: "2026-05-18T07:50:00Z", appHint: "Finance" },
  { id: "n-003", kind: "deadline", title: "Sprint ends tomorrow", body: "Garuda Core — Sprint 18 (22 points still in progress).", at: "2026-05-18T07:20:00Z", appHint: "Sprints" },
  { id: "n-004", kind: "blocker", title: "Blocker — Lab order workflow", body: "FHIR mapping pending from Selasar HealthTech.", at: "2026-05-17T16:30:00Z", appHint: "Projects" },
  { id: "n-005", kind: "approval", title: "Approval pending", body: "Putri Andriani submitted 38h timesheet (May 12–16).", at: "2026-05-17T18:30:00Z", appHint: "Timesheets" },
  { id: "n-006", kind: "follow-up", title: "Follow-up due", body: "Galuh FinTech — Negotiation call scheduled for Tuesday.", at: "2026-05-19T09:00:00Z", appHint: "CRM" },
  { id: "n-007", kind: "deadline", title: "Renewal in 12 days", body: "Sinar Properti CRM Retainer expires 2026-05-30.", at: "2026-05-18T06:00:00Z", appHint: "Contracts" },
];

let counter = 0;
const nextId = () => `n-${Date.now()}-${counter++}`;

function recountUnread(list: DesktopNotification[]) {
  return list.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: DEFAULTS,
  unread: DEFAULTS.length,
  filter: "all",
  setFilter: (f) => set({ filter: f }),
  markRead: (id) =>
    set((s) => {
      const next = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications: next, unread: recountUnread(next) };
    }),
  markUnread: (id) =>
    set((s) => {
      const next = s.notifications.map((n) => (n.id === id ? { ...n, read: false } : n));
      return { notifications: next, unread: recountUnread(next) };
    }),
  markAllRead: () =>
    set((s) => {
      const next = s.notifications.map((n) => ({ ...n, read: true }));
      return { notifications: next, unread: 0 };
    }),
  dismiss: (id) =>
    set((s) => {
      const next = s.notifications.filter((n) => n.id !== id);
      return { notifications: next, unread: recountUnread(next) };
    }),
  push: (n) => {
    const id = nextId();
    const item: DesktopNotification = {
      ...n,
      id,
      at: new Date().toISOString(),
      read: false,
    };
    set((s) => {
      const next = [item, ...s.notifications];
      return { notifications: next, unread: recountUnread(next) };
    });
    return id;
  },
}));
