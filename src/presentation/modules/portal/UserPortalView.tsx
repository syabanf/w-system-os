"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Coffee,
  GraduationCap,
  ListChecks,
  LogIn,
  LogOut,
  MessageSquare,
  Plane,
  Send,
  Smile,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { mockTeam } from "@/infrastructure/data/team.mock";
import {
  mockOnboardingTasks,
  mockChatThreads,
  mockChatMessages,
  mockEmployeeLeaveRequests,
  mockHRSlots,
  mockHRMeetingRequests,
  PORTAL_EMPLOYEE_ID,
} from "@/infrastructure/data/portal.mock";
import type {
  OnboardingTask,
  OnboardingStatus,
  ChatMessage,
  HRMeetingPurpose,
} from "@/domain/entities/Portal";
import { cn } from "@/lib/cn";
import { formatDate, relativeFromNow } from "@/lib/date";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));
const ME = teamMap.get(PORTAL_EMPLOYEE_ID);

type Tab = "checkin" | "onboarding" | "chat" | "leave" | "hr";

const STATUS_TONE: Record<OnboardingStatus, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Done: "success",
  "In Progress": "wit",
  Pending: "neutral",
  Blocked: "danger",
};

export function UserPortalView() {
  const [tab, setTab] = useState<Tab>("checkin");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          {ME ? (
            <Avatar name={ME.name} initials={ME.initials} color={ME.avatarColor} size="lg" />
          ) : null}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              People · Self-service
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
              {ME ? `Welcome back, ${ME.name.split(" ")[0]}` : "User Portal"}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Check in, complete onboarding, message HR, request leave, or book a meeting.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabSwitch tab={tab} onChange={setTab} />
          <ManageMasterDataButton moduleId="portal" />
        </div>
      </header>

      {tab === "checkin" && <CheckinTab />}
      {tab === "onboarding" && <OnboardingTab />}
      {tab === "chat" && <ChatTab />}
      {tab === "leave" && <LeaveRequestTab />}
      {tab === "hr" && <MeetHRTab />}
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string; icon: typeof CalendarCheck }[] = [
    { id: "checkin", label: "Check-in", icon: CalendarCheck },
    { id: "onboarding", label: "Onboarding", icon: GraduationCap },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "leave", label: "Leave", icon: Plane },
    { id: "hr", label: "Meet HR", icon: UserCheck },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
              tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            <Icon className="h-3 w-3" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// CHECK-IN
// ============================================================================

function CheckinTab() {
  const [clockedIn, setClockedIn] = useState(true);
  const [clockInAt, setClockInAt] = useState("08:55");
  const [toast, setToast] = useState<string | null>(null);

  const now = new Date();
  const nowTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  const handleClockIn = () => {
    setClockInAt(nowTime);
    setClockedIn(true);
    setToast(`Clocked in at ${nowTime}`);
    setTimeout(() => setToast(null), 3000);
  };
  const handleClockOut = () => {
    setClockedIn(false);
    setToast(`Clocked out at ${nowTime}`);
    setTimeout(() => setToast(null), 3000);
  };

  // Week summary (mock)
  const weekDays = [
    { day: "Mon", date: "May 12", in: "08:55", out: "18:05", hours: 9, status: "Present" },
    { day: "Tue", date: "May 13", in: "08:50", out: "17:50", hours: 9, status: "Present" },
    { day: "Wed", date: "May 14", in: "09:24", out: "18:10", hours: 8.75, status: "Late" },
    { day: "Thu", date: "May 15", in: "08:48", out: "18:15", hours: 9.25, status: "Present" },
    { day: "Fri", date: "May 16", in: "08:52", out: "17:55", hours: 9.05, status: "Present" },
  ];
  const totalHours = weekDays.reduce((s, d) => s + d.hours, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Clock}
          label="Today"
          value={clockedIn ? clockInAt : "—"}
          delta={clockedIn ? "Clocked in" : "Not clocked in"}
          trend={clockedIn ? "up" : "flat"}
        />
        <MetricCard icon={CalendarCheck} label="This Week" value={`${totalHours.toFixed(1)}h`} delta="5 days logged" accent="#34D399" />
        <MetricCard icon={Coffee} label="Break left" value="42m" accent="#FBBF24" />
        <MetricCard icon={Smile} label="Streak" value="14 days" delta="no late this week" accent="#60A5FA" />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Self-service · Attendance"
          title="Clock in / out"
          description="Web-based check-in. Your manager and HR see the timestamp + (mock) location."
        />
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            {clockedIn ? <LogOut className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {clockedIn ? "You're clocked in" : "You're clocked out"}
            </div>
            <div className="text-base font-semibold text-zinc-50">
              {clockedIn ? `Since ${clockInAt} today` : "Tap to check in"}
            </div>
            <div className="mt-0.5 text-[10px] text-zinc-500">
              Office WIT-Jakarta · −6.2087, 106.8456 · Geofence ✓
            </div>
          </div>
          {clockedIn ? (
            <button
              onClick={handleClockOut}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
            >
              <LogOut className="h-3.5 w-3.5" />
              Clock out
            </button>
          ) : (
            <button
              onClick={handleClockIn}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
            >
              <LogIn className="h-3.5 w-3.5" />
              Clock in
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="History" title="This week" description="Your last 5 working days." />
        <ul className="space-y-1.5">
          {weekDays.map((d) => (
            <li
              key={d.day}
              className="grid grid-cols-12 items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/[0.04]"
            >
              <span className="col-span-2 text-xs font-semibold text-zinc-100">
                {d.day} · <span className="text-zinc-400">{d.date}</span>
              </span>
              <span className="col-span-2 font-mono text-[11px] text-zinc-200">In {d.in}</span>
              <span className="col-span-2 font-mono text-[11px] text-zinc-200">Out {d.out}</span>
              <span className="col-span-3 font-mono text-[11px] text-zinc-300">{d.hours}h</span>
              <span className="col-span-3 text-right">
                <StatusBadge tone={d.status === "Late" ? "warning" : "success"} dot>
                  {d.status}
                </StatusBadge>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {toast ? <Toast text={toast} /> : null}
    </div>
  );
}

// ============================================================================
// ONBOARDING
// ============================================================================

function OnboardingTab() {
  const [tasks, setTasks] = useState<OnboardingTask[]>(mockOnboardingTasks);
  const toggle = (id: string) =>
    setTasks((all) =>
      all.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "Done" ? "In Progress" : "Done",
              completedAt: t.status === "Done" ? undefined : new Date().toISOString().slice(0, 10),
            }
          : t,
      ),
    );

  const done = tasks.filter((t) => t.status === "Done").length;
  const total = tasks.length;
  const pct = Math.round((done / total) * 100);

  const grouped = useMemo(() => {
    const map = new Map<number, OnboardingTask[]>();
    tasks.forEach((t) => {
      const list = map.get(t.weekNumber) ?? [];
      list.push(t);
      map.set(t.weekNumber, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [tasks]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={ListChecks}
          label="Progress"
          value={`${done}/${total}`}
          delta={`${pct}% complete`}
          trend="up"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Done"
          value={String(done)}
          accent="#34D399"
        />
        <MetricCard
          icon={Clock}
          label="In Progress"
          value={String(tasks.filter((t) => t.status === "In Progress").length)}
          accent="#FBBF24"
        />
        <MetricCard
          icon={GraduationCap}
          label="Week"
          value="3 of 4"
          accent="#60A5FA"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Your onboarding plan"
          title="First 30 days at WIT.ID"
          description="Check off each task as you complete it. HR auto-notified on milestones."
        />

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #34D399, #60A5FA, #FBBF24)",
            }}
          />
        </div>

        <div className="space-y-4">
          {grouped.map(([week, items]) => (
            <div key={week}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-200">
                  Week {week}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {items.filter((i) => i.status === "Done").length}/{items.length} done
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="glass-soft flex items-start gap-3 rounded-xl border border-white/6 p-3"
                  >
                    <button
                      onClick={() => toggle(t.id)}
                      aria-label={t.status === "Done" ? "Mark not done" : "Mark done"}
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                        t.status === "Done"
                          ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                          : "border-white/15 hover:border-white/30",
                      )}
                    >
                      {t.status === "Done" ? <CheckCircle2 className="h-3 w-3" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            t.status === "Done"
                              ? "text-zinc-500 line-through"
                              : "text-zinc-100",
                          )}
                        >
                          {t.title}
                        </span>
                        <StatusBadge tone={STATUS_TONE[t.status]}>{t.category}</StatusBadge>
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400">{t.description}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                        {t.ownerHint}
                        {t.completedAt ? (
                          <span className="ml-2 text-emerald-300">
                            · done {formatDate(t.completedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CHAT
// ============================================================================

function ChatTab() {
  const [activeId, setActiveId] = useState(mockChatThreads[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [draft, setDraft] = useState("");

  const threadMessages = useMemo(
    () =>
      messages
        .filter((m) => m.threadId === activeId)
        .sort((a, b) => (a.at < b.at ? -1 : 1)),
    [messages, activeId],
  );

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `cm-${Math.random().toString(36).slice(2, 7)}`,
        threadId: activeId,
        fromMemberId: PORTAL_EMPLOYEE_ID,
        content: draft.trim(),
        at: new Date().toISOString(),
      },
    ]);
    setDraft("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
      <div className="glass rounded-[20px] p-3">
        <SectionHeader eyebrow="Conversations" title="Inbox" />
        <ul className="space-y-1">
          {mockChatThreads.map((th) => {
            const other = teamMap.get(th.participantIds.find((id) => id !== PORTAL_EMPLOYEE_ID) ?? "");
            const isActive = activeId === th.id;
            return (
              <li key={th.id}>
                <button
                  onClick={() => setActiveId(th.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl p-2 text-left transition-colors",
                    isActive ? "bg-white/10" : "hover:bg-white/[0.04]",
                  )}
                >
                  {other ? (
                    <Avatar
                      name={other.name}
                      initials={other.initials}
                      color={other.avatarColor}
                      size="sm"
                    />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-semibold text-zinc-100">
                        {th.title}
                      </span>
                      {th.unread > 0 ? (
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-zinc-100 px-1 text-[9px] font-bold text-zinc-900">
                          {th.unread}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-zinc-400">
                      {th.lastMessage}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                      {th.kind} · {relativeFromNow(th.lastAt)}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="glass flex flex-col rounded-[20px] p-5">
        <SectionHeader
          eyebrow={mockChatThreads.find((t) => t.id === activeId)?.kind ?? ""}
          title={mockChatThreads.find((t) => t.id === activeId)?.title ?? "Conversation"}
        />
        <div className="glass-scroll flex max-h-[420px] flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-white/6 p-3">
          {threadMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
              No messages yet. Say hi 👋
            </div>
          ) : (
            threadMessages.map((m) => {
              const fromMe = m.fromMemberId === PORTAL_EMPLOYEE_ID;
              const member = teamMap.get(m.fromMemberId);
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex max-w-[80%] gap-2",
                    fromMe ? "ml-auto flex-row-reverse" : "",
                  )}
                >
                  {!fromMe && member ? (
                    <Avatar
                      name={member.name}
                      initials={member.initials}
                      color={member.avatarColor}
                      size="sm"
                    />
                  ) : null}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-xs",
                      fromMe
                        ? "bg-emerald-500/15 text-emerald-100"
                        : "bg-white/[0.06] text-zinc-100",
                    )}
                  >
                    {!fromMe ? (
                      <div className="mb-0.5 text-[10px] font-semibold text-zinc-300">
                        {member?.name ?? "Unknown"}
                      </div>
                    ) : null}
                    {m.content}
                    <div className="mt-1 text-right text-[9px] text-zinc-400">
                      {relativeFromNow(m.at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold",
              draft.trim()
                ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                : "bg-white/[0.05] text-zinc-500",
            )}
          >
            <Send className="h-3 w-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEAVE REQUEST
// ============================================================================

function LeaveRequestTab() {
  type LeaveType = "Annual" | "Sick" | "Maternity" | "Bereavement" | "Unpaid";
  const [leaveType, setLeaveType] = useState<LeaveType>("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [requests, setRequests] = useState(mockEmployeeLeaveRequests);

  const types: LeaveType[] = ["Annual", "Sick", "Maternity", "Bereavement", "Unpaid"];
  const balances = [
    { type: "Annual", entitled: 12, used: 4, remaining: 8 },
    { type: "Sick", entitled: 12, used: 2, remaining: 10 },
    { type: "Bereavement", entitled: 5, used: 0, remaining: 5 },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    const days =
      Math.floor(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;
    setRequests((prev) => [
      {
        id: `elr-${Math.random().toString(36).slice(2, 6)}`,
        employeeId: "emp-3",
        type: leaveType,
        startDate,
        endDate,
        days: Math.max(1, days),
        reason: reason.trim() || "—",
        status: "pending",
        submittedAt: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setStartDate("");
    setEndDate("");
    setReason("");
    setToast(`✓ Submitted leave request: ${leaveType} · ${days} day(s)`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {balances.map((b) => (
          <div key={b.type} className="glass-soft rounded-2xl border border-white/8 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {b.type} leave
            </div>
            <div className="mt-1 text-2xl font-semibold text-zinc-50">
              {b.remaining}{" "}
              <span className="text-sm font-normal text-zinc-500">/ {b.entitled} days</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(b.used / b.entitled) * 100}%`,
                  background: "linear-gradient(90deg, #34D399, #60A5FA)",
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-zinc-500">{b.used} used</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,360px]">
        <form
          onSubmit={submit}
          className="glass rounded-[20px] p-5"
        >
          <SectionHeader
            eyebrow="New request"
            title="Request leave"
            description="HR is notified immediately. Your manager approves first."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Leave type
              </span>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 focus:border-white/25 focus:outline-none"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Start date
              </span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 focus:border-white/25 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">End date</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 focus:border-white/25 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Reason</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Short note for your manager…"
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
            >
              <Send className="h-3 w-3" />
              Submit
            </button>
          </div>
        </form>

        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="History" title="Recent requests" />
          <ul className="space-y-1.5">
            {requests.map((r) => (
              <li
                key={r.id}
                className="glass-soft rounded-xl border border-white/6 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-100">{r.type} leave</div>
                    <div className="mt-0.5 text-[10px] text-zinc-400">
                      {r.startDate} → {r.endDate} · {r.days} day{r.days === 1 ? "" : "s"}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-300">{r.reason}</div>
                  </div>
                  <StatusBadge
                    tone={
                      r.status === "approved"
                        ? "success"
                        : r.status === "pending"
                          ? "warning"
                          : r.status === "rejected"
                            ? "danger"
                            : "neutral"
                    }
                  >
                    {r.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {toast ? <Toast text={toast} /> : null}
    </div>
  );
}

// ============================================================================
// MEET HR
// ============================================================================

function MeetHRTab() {
  const purposes: HRMeetingPurpose[] = [
    "Onboarding",
    "Performance",
    "Career",
    "Comp & Benefits",
    "Wellbeing",
    "Other",
  ];

  const [activeDate, setActiveDate] = useState<string>(mockHRSlots[0].date);
  const [purpose, setPurpose] = useState<HRMeetingPurpose>("Onboarding");
  const [notes, setNotes] = useState("");
  const [requests, setRequests] = useState(mockHRMeetingRequests);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dates = Array.from(new Set(mockHRSlots.map((s) => s.date)));
  const slotsForDate = mockHRSlots.filter((s) => s.date === activeDate);

  const book = () => {
    const slot = mockHRSlots.find((s) => s.id === selectedSlotId);
    if (!slot) return;
    const member = teamMap.get(slot.hrMemberId);
    setRequests((prev) => [
      {
        id: `hmr-${Math.random().toString(36).slice(2, 6)}`,
        hrMemberId: slot.hrMemberId,
        employeeMemberId: PORTAL_EMPLOYEE_ID,
        date: slot.date,
        time: slot.startTime,
        purpose,
        notes: notes.trim() || "—",
        status: "Requested",
      },
      ...prev,
    ]);
    setSelectedSlotId(null);
    setNotes("");
    setToast(
      `✓ Meeting requested with ${member?.name ?? "HR"} on ${formatDate(slot.date)} at ${slot.startTime}`,
    );
    setTimeout(() => setToast(null), 4500);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Pick a slot"
            title="HR availability"
            description="Tap a date, then choose a 30-minute slot."
          />
          <div className="mb-4 flex flex-wrap gap-1.5">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDate(d)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-[10px] transition-colors",
                  activeDate === d
                    ? "border-white/25 bg-white/10 text-zinc-50"
                    : "border-white/8 bg-white/[0.025] text-zinc-300 hover:bg-white/[0.05]",
                )}
              >
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                  {new Date(d).toLocaleDateString("en-GB", { weekday: "short" })}
                </div>
                <div className="text-xs font-semibold">
                  {new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </div>
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
            {slotsForDate.map((s) => {
              const member = teamMap.get(s.hrMemberId);
              const disabled = s.booked;
              const isSelected = selectedSlotId === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => !disabled && setSelectedSlotId(s.id)}
                    disabled={disabled}
                    className={cn(
                      "glass-soft w-full rounded-xl border p-2.5 text-left transition-all",
                      disabled
                        ? "border-white/6 opacity-40"
                        : isSelected
                          ? "border-emerald-400/50 bg-emerald-500/10"
                          : "border-white/8 hover:border-white/20",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {member ? (
                        <Avatar
                          name={member.name}
                          initials={member.initials}
                          color={member.avatarColor}
                          size="sm"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-zinc-100">
                          {s.startTime}–{s.endTime}
                        </div>
                        <div className="truncate text-[10px] text-zinc-400">
                          {member?.name ?? "HR"}
                        </div>
                      </div>
                    </div>
                    {disabled ? (
                      <div className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500">
                        Booked
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Meeting details" title="Why are you meeting HR?" />
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Purpose</span>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as HRMeetingPurpose)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 focus:border-white/25 focus:outline-none"
              >
                {purposes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Optional context for HR before the meeting…"
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
              />
            </label>
            {selectedSlotId ? (
              <div className="glass-soft rounded-xl border border-white/8 p-3 text-[11px] text-zinc-200">
                <Sparkles className="mr-1 inline h-3 w-3 text-emerald-300" />
                Selected: <strong>{
                  mockHRSlots.find((s) => s.id === selectedSlotId)?.startTime
                } – {mockHRSlots.find((s) => s.id === selectedSlotId)?.endTime}</strong>{" "}
                on {formatDate(activeDate)} with{" "}
                {teamMap.get(mockHRSlots.find((s) => s.id === selectedSlotId)?.hrMemberId ?? "")?.name}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[11px] text-zinc-500">
                Tap a slot on the left to continue.
              </div>
            )}
            <button
              onClick={book}
              disabled={!selectedSlotId}
              className={cn(
                "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold",
                selectedSlotId
                  ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                  : "bg-white/[0.05] text-zinc-500",
              )}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Request meeting
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="History"
          title={`Your HR meetings (${requests.length})`}
        />
        <ul className="space-y-1.5">
          {requests.map((r) => {
            const hr = teamMap.get(r.hrMemberId);
            return (
              <li
                key={r.id}
                className="grid grid-cols-12 items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/[0.04]"
              >
                <span className="col-span-4 flex items-center gap-2">
                  {hr ? (
                    <Avatar
                      name={hr.name}
                      initials={hr.initials}
                      color={hr.avatarColor}
                      size="sm"
                    />
                  ) : null}
                  <span className="truncate text-xs text-zinc-100">{hr?.name ?? "HR"}</span>
                </span>
                <span className="col-span-3 text-[11px] text-zinc-300">
                  {formatDate(r.date)} · {r.time}
                </span>
                <span className="col-span-3 text-[11px] text-zinc-300">{r.purpose}</span>
                <span className="col-span-2 text-right">
                  <StatusBadge
                    tone={
                      r.status === "Confirmed"
                        ? "success"
                        : r.status === "Completed"
                          ? "info"
                          : r.status === "Cancelled"
                            ? "danger"
                            : "warning"
                    }
                  >
                    {r.status}
                  </StatusBadge>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {toast ? <Toast text={toast} /> : null}
    </div>
  );
}

// ============================================================================
// SHARED
// ============================================================================

function Toast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs text-zinc-100 shadow-lg ring-1 ring-white/15">
      {text}
    </div>
  );
}
