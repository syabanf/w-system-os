"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  Ban,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  Receipt,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useSetupStore } from "@/state/setup.store";
import { useProfileStore } from "@/state/profile.store";
import { ModuleIcon } from "@/presentation/shared/ModuleIcon";
import { useWindowStore } from "@/state/window.store";
import { useSpotlightStore } from "@/state/spotlight.store";
import { formatDemoToday } from "@/lib/date";
import {
  useNotificationStore,
  type DesktopNotification,
  type NotificationKind,
} from "@/state/notification.store";

const DOCK_IDS: AppModuleId[] = ["dashboard", "leads", "projects", "finance", "support"];

/** Visual + routing metadata per notification kind. */
const KIND_META: Record<
  NotificationKind,
  { label: string; icon: LucideIcon; color: string; app: AppModuleId }
> = {
  sla: { label: "SLA", icon: AlertOctagon, color: "#FB7185", app: "support" },
  invoice: { label: "Invoice", icon: Receipt, color: "#FBBF24", app: "finance" },
  deadline: { label: "Deadline", icon: CalendarClock, color: "#60A5FA", app: "projects" },
  blocker: { label: "Blocker", icon: Ban, color: "#F87171", app: "projects" },
  approval: { label: "Approval", icon: CheckCircle2, color: "#34D399", app: "timesheet" },
  "follow-up": { label: "Follow-up", icon: PhoneCall, color: "#A78BFA", app: "leads" },
};

/** Map a notification's free-text appHint to a real module to deep-link into. */
const APP_HINT_TO_ID: Record<string, AppModuleId> = {
  Support: "support",
  Finance: "finance",
  Sprints: "projects",
  Projects: "projects",
  Timesheets: "timesheet",
  CRM: "leads",
  Contracts: "clients",
};

/** Quick-stat tiles surfaced from the live inbox, grouped by kind. */
const STAT_KINDS: NotificationKind[] = ["sla", "invoice", "approval", "follow-up"];

interface TabletIconProps {
  module: AppModule;
  index?: number;
  size?: "grid" | "dock";
  onClick: () => void;
}

function TabletIcon({ module, index = 0, size = "grid", onClick }: TabletIconProps) {
  const tile = module.accentLight;
  const tileClass = size === "grid"
    ? "h-[78px] w-[78px] rounded-[28%]"
    : "h-[58px] w-[58px] rounded-[28%]";
  const iconClass = size === "grid" ? "h-[44px] w-[44px]" : "h-[32px] w-[32px]";

  const tileEl = (
    <span
      className={`grid place-items-center transition-transform group-hover:-translate-y-1 group-active:scale-95 ${tileClass}`}
      style={{
        background: `linear-gradient(150deg, ${tile} 0%, ${tile}d9 100%)`,
        boxShadow: `0 10px 30px -10px ${tile}66, inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.25)`,
      }}
    >
      <ModuleIcon
        module={module}
        className={`text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.30)] ${iconClass}`}
        strokeWidth={2.2}
      />
    </span>
  );

  if (size === "dock") {
    return (
      <button onClick={onClick} aria-label={`Open ${module.name}`} className="group">
        {tileEl}
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.025, type: "spring", stiffness: 320, damping: 22 }}
      className="group flex flex-col items-center gap-2"
    >
      {tileEl}
      <span className="text-xs font-medium text-zinc-100/95 drop-shadow">
        {module.shortName}
      </span>
    </motion.button>
  );
}

export function TabletHomeScreen() {
  const openApp = useWindowStore((s) => s.openApp);
  const openSpotlight = useSpotlightStore((s) => s.open);
  const notifications = useNotificationStore((s) => s.notifications);
  const unread = useNotificationStore((s) => s.unread);
  const markRead = useNotificationStore((s) => s.markRead);
  const enabled = useSetupStore((s) => s.enabled);
  const profile = useProfileStore((s) => s.profile);

  const dockSet = new Set(DOCK_IDS);
  const enabledSet = new Set(enabled);
  const gridApps = APP_MODULES.filter((m) => !dockSet.has(m.id) && enabledSet.has(m.id));
  const dockApps = DOCK_IDS.map((id) => APP_MODULES.find((m) => m.id === id)).filter(
    (m): m is AppModule => m !== undefined && enabledSet.has(m.id),
  );

  // Unread first, then most recent — the inbox preview.
  const inbox = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (!!a.read !== !!b.read) return a.read ? 1 : -1;
        return a.at < b.at ? 1 : -1;
      }),
    [notifications],
  );

  const countByKind = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const n of notifications) acc[n.kind] = (acc[n.kind] ?? 0) + 1;
    return acc;
  }, [notifications]);

  const openFromNotification = (n: DesktopNotification) => {
    markRead(n.id);
    const hintId = n.appHint ? APP_HINT_TO_ID[n.appHint] : undefined;
    openApp(hintId ?? KIND_META[n.kind].app);
  };

  return (
    <div className="touch-readable flex h-full flex-col px-10 pb-3 pt-4">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="on-wallpaper text-[10px] uppercase tracking-[0.22em] opacity-90">
            Good morning
          </div>
          <div className="on-wallpaper text-3xl font-semibold tracking-tight">
            {profile.name}
          </div>
          <div className="on-wallpaper mt-0.5 text-xs opacity-90">
            {formatDemoToday()} · {unread} {unread === 1 ? "signal" : "signals"} waiting in your inbox
          </div>
        </div>
        <button
          onClick={openSpotlight}
          className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/8"
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <kbd className="rounded bg-white/10 px-1.5 text-[9px] text-zinc-300">⌘K</kbd>
        </button>
      </div>

      {/* App grid — natural height so it doesn't swallow the canvas. */}
      <div className="grid grid-cols-6 content-start gap-x-6 gap-y-5">
        {gridApps.map((module, i) => (
          <TabletIcon key={module.id} module={module} index={i} onClick={() => openApp(module.id)} />
        ))}
      </div>

      {/* Widgets band — fills the previously-empty space with live data:
          a compact stat row across the top, then the inbox fills the rest. */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
        <div className="grid shrink-0 grid-cols-4 gap-3">
          {STAT_KINDS.map((kind) => (
            <StatTile
              key={kind}
              kind={kind}
              count={countByKind[kind] ?? 0}
              onClick={() => openApp(KIND_META[kind].app)}
            />
          ))}
        </div>

        <SignalsWidget
          inbox={inbox}
          unread={unread}
          onOpen={openFromNotification}
          onOpenAll={() => openApp("dashboard")}
        />
      </div>

      <div className="mt-5 flex justify-center">
        <div className="glass-strong flex items-center gap-2 rounded-[26px] px-3 py-2 shadow-[0_22px_70px_-25px_rgba(0,0,0,0.7)]">
          {dockApps.map((module) => (
            <TabletIcon key={module.id} module={module} size="dock" onClick={() => openApp(module.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SignalsWidgetProps {
  inbox: DesktopNotification[];
  unread: number;
  onOpen: (n: DesktopNotification) => void;
  onOpenAll: () => void;
}

function SignalsWidget({ inbox, unread, onOpen, onOpenAll }: SignalsWidgetProps) {
  return (
    <section className="glass col-span-2 flex min-h-0 flex-col rounded-[24px] p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-zinc-100">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-zinc-50">Inbox</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {unread} unread · {inbox.length} total
            </div>
          </div>
        </div>
        <button
          onClick={onOpenAll}
          className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-white/12"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </header>

      <div className="glass-scroll -mx-1 flex-1 space-y-1.5 overflow-y-auto px-1">
        {inbox.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-zinc-400">
            You&apos;re all caught up.
          </div>
        ) : (
          inbox.map((n) => {
            const meta = KIND_META[n.kind];
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => onOpen(n)}
                className="group flex w-full items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <span
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${meta.color}1f`, color: meta.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {!n.read ? (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: meta.color }}
                      />
                    ) : null}
                    <span className="truncate text-[12px] font-semibold text-zinc-100">
                      {n.title}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                    {n.body}
                  </span>
                </span>
                <span className="ml-1 shrink-0 self-center rounded-full bg-white/6 px-2 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                  {n.appHint ?? meta.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatTile({
  kind,
  count,
  onClick,
}: {
  kind: NotificationKind;
  count: number;
  onClick: () => void;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      className="group glass flex h-[104px] flex-col justify-between rounded-[22px] p-3.5 text-left transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ background: `${meta.color}1f`, color: meta.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-zinc-200" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold leading-none text-zinc-50">
          {count}
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
          {meta.label}
        </span>
      </div>
    </button>
  );
}
