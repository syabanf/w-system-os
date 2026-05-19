"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  AlarmClock,
  BellRing,
  Check,
  FileSignature,
  Megaphone,
  Receipt,
  ShieldAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import {
  useNotificationStore,
  type NotificationFilter,
  type NotificationKind,
} from "@/state/notification.store";
import { relativeFromNow } from "@/lib/date";
import { cn } from "@/lib/cn";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  deadline: AlarmClock,
  invoice: Receipt,
  blocker: ShieldAlert,
  approval: FileSignature,
  "follow-up": Megaphone,
  sla: AlertOctagon,
};

const KIND_ACCENT: Record<NotificationKind, string> = {
  deadline: "#F59E0B",
  invoice: "#EF4444",
  blocker: "#A855F7",
  approval: "#3B82F6",
  "follow-up": "#22C55E",
  sla: "#F87171",
};

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "sla", label: "SLA" },
  { id: "invoice", label: "Invoices" },
  { id: "deadline", label: "Deadlines" },
  { id: "approval", label: "Approvals" },
  { id: "blocker", label: "Blockers" },
  { id: "follow-up", label: "Follow-ups" },
];

export function NotificationCenter() {
  const isNotificationsOpen = useDesktopStore((s) => s.isNotificationsOpen);
  const toggleNotifications = useDesktopStore((s) => s.toggleNotifications);
  const notifications = useNotificationStore((s) => s.notifications);
  const unread = useNotificationStore((s) => s.unread);
  const filter = useNotificationStore((s) => s.filter);
  const setFilter = useNotificationStore((s) => s.setFilter);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const dismiss = useNotificationStore((s) => s.dismiss);

  const visible = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.kind === filter);
  }, [notifications, filter]);

  return (
    <AnimatePresence>
      {isNotificationsOpen ? (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="glass-strong fixed right-3 top-12 z-40 flex h-[calc(100vh-160px)] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        >
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative">
                <BellRing className="h-4 w-4 text-zinc-200" />
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-rose-500 text-[8px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </span>
              <div>
                <div className="text-sm font-semibold text-zinc-50">Notifications</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  {unread > 0 ? `${unread} unread · ` : ""}
                  {notifications.length} total
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllRead}
                disabled={unread === 0}
                className="rounded-md px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-white/8 hover:text-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              >
                Mark all read
              </button>
              <button
                onClick={toggleNotifications}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/8 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="border-b border-white/6 px-3 py-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors",
                      active
                        ? "bg-white/15 text-zinc-50"
                        : "text-zinc-400 hover:bg-white/8 hover:text-zinc-200",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-scroll flex-1 overflow-y-auto p-3">
            {visible.length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <BellRing className="mx-auto h-6 w-6 text-zinc-600" />
                  <div className="mt-2 text-xs text-zinc-400">No notifications</div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {filter === "all" ? "You're all caught up." : "Try another filter."}
                  </div>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {visible.map((n) => {
                    const Icon = KIND_ICON[n.kind];
                    const accent = KIND_ACCENT[n.kind];
                    return (
                      <motion.li
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                        className={cn(
                          "glass-soft group relative overflow-hidden rounded-xl border border-white/6 p-3 transition-colors",
                          "hover:border-white/12",
                          n.read && "opacity-60",
                        )}
                      >
                        {!n.read ? (
                          <span
                            aria-hidden
                            className="absolute inset-y-2 left-0 w-[3px] rounded-r-full"
                            style={{ background: accent }}
                          />
                        ) : null}
                        <div className="flex items-start gap-3">
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                            style={{ background: `${accent}26`, color: accent }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="truncate text-xs font-semibold text-zinc-100">
                                {n.title}
                              </div>
                              <span className="shrink-0 text-[10px] text-zinc-500">
                                {relativeFromNow(n.at)}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                              {n.body}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              {n.appHint ? (
                                <span className="inline-block rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                                  {n.appHint}
                                </span>
                              ) : (
                                <span />
                              )}
                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                {!n.read ? (
                                  <button
                                    onClick={() => markRead(n.id)}
                                    aria-label="Mark as read"
                                    title="Mark as read"
                                    className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-emerald-300"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                ) : null}
                                <button
                                  onClick={() => dismiss(n.id)}
                                  aria-label="Dismiss"
                                  title="Dismiss"
                                  className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-rose-300"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
