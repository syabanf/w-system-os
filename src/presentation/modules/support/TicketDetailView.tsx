"use client";

import {
  AlarmClock,
  AlertOctagon,
  Briefcase,
  GitPullRequest,
  Hourglass,
  Timer,
  Users2,
} from "lucide-react";
import type { EnrichedTicket } from "@/application/use-cases/support/GetTicketSLAOverview";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";

const SEVERITY_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  low: "info",
  medium: "warning",
  high: "warning",
  critical: "danger",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Open: "danger",
  Investigating: "warning",
  "Waiting Client": "info",
  "In Progress": "wit",
  Resolved: "success",
  Closed: "neutral",
};

function ageHours(iso: string): number {
  return (new Date("2026-05-18T09:00:00Z").getTime() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function TicketDetailView({ ticket }: { ticket: EnrichedTicket }) {
  const age = Math.max(0, ageHours(ticket.createdAt));
  const slaTotalHours = (new Date(ticket.slaDeadline).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
  const slaConsumed = Math.min(100, Math.max(0, ((age / Math.max(1, slaTotalHours)) * 100)));

  const slaState: "ok" | "at-risk" | "breached" = ticket.isBreached
    ? "breached"
    : ticket.isAtRisk
      ? "at-risk"
      : "ok";

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {ticket.code}
              </span>
              <StatusBadge tone={STATUS_TONE[ticket.status]}>{ticket.status}</StatusBadge>
              <StatusBadge tone={SEVERITY_TONE[ticket.severity]} dot>
                {ticket.severity}
              </StatusBadge>
              {ticket.isChangeRequest ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-purple-200">
                  <GitPullRequest className="h-3 w-3" />
                  Change request
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {ticket.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5 text-zinc-500" />
                {ticket.clientName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                {ticket.projectName}
              </span>
              <span className="text-zinc-500">
                opened {ticket.createdAt.slice(0, 16).replace("T", " ")} · assignee{" "}
                {ticket.assigneeName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={AlarmClock}
          label="SLA deadline"
          value={ticket.slaDeadline.slice(0, 16).replace("T", " ")}
          delta={
            ticket.isBreached
              ? `${Math.abs(Math.round(ticket.hoursUntilSLA))}h overdue`
              : `${Math.round(ticket.hoursUntilSLA * 10) / 10}h remaining`
          }
          trend={ticket.isBreached ? "down" : ticket.isAtRisk ? "down" : "up"}
          accent={ticket.isBreached ? "#EF4444" : ticket.isAtRisk ? "#F59E0B" : "#22C55E"}
        />
        <MetricCard
          icon={Hourglass}
          label="Age"
          value={`${Math.round(age * 10) / 10}h`}
          delta="since opened"
          accent="#3B82F6"
        />
        <MetricCard
          icon={Timer}
          label="Estimated effort"
          value={ticket.estimatedEffortHours ? `${ticket.estimatedEffortHours}h` : "—"}
          accent="#71717A"
        />
        <MetricCard
          icon={AlertOctagon}
          label="SLA state"
          value={slaState === "breached" ? "Breached" : slaState === "at-risk" ? "At risk" : "On track"}
          accent={slaState === "breached" ? "#EF4444" : slaState === "at-risk" ? "#F59E0B" : "#22C55E"}
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="SLA pressure"
          title={`${Math.round(slaConsumed)}% of window consumed`}
          description="From ticket open to SLA deadline."
        />
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${slaConsumed}%`,
              background:
                slaState === "breached"
                  ? "linear-gradient(90deg, #F87171, #EF4444)"
                  : slaState === "at-risk"
                    ? "linear-gradient(90deg, #FBBF24, #F59E0B)"
                    : "linear-gradient(90deg, #34D399, #FAFAF9)",
            }}
          />
          <div
            className="absolute inset-y-0 w-px bg-white/60"
            style={{ left: `${slaConsumed}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
          <span>Open · {ticket.createdAt.slice(0, 16).replace("T", " ")}</span>
          <span>Deadline · {ticket.slaDeadline.slice(0, 16).replace("T", " ")}</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Routing" title="Ownership" />
          <ul className="space-y-2 text-[11px]">
            <Row label="Assigned to" value={ticket.assigneeName} />
            <Row label="Client" value={ticket.clientName} />
            <Row label="Project" value={ticket.projectName} />
            <Row label="Severity" value={ticket.severity} />
            <Row label="Type" value={ticket.isChangeRequest ? "Change request" : "Incident"} />
          </ul>
        </div>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Timeline" title="Activity" />
          <ol className="space-y-2 text-[11px]">
            <TimelineItem
              when={ticket.createdAt}
              title="Ticket opened"
              body={`Raised against ${ticket.projectName} for ${ticket.clientName}.`}
            />
            <TimelineItem
              when={ticket.createdAt}
              title={`Assigned to ${ticket.assigneeName}`}
              body="Triaged at intake."
            />
            <TimelineItem
              when={ticket.slaDeadline}
              title={ticket.isBreached ? "SLA breached" : "SLA deadline"}
              body={
                ticket.isBreached
                  ? `Missed by ${Math.abs(Math.round(ticket.hoursUntilSLA))}h.`
                  : `${Math.round(ticket.hoursUntilSLA * 10) / 10}h remaining.`
              }
              tone={ticket.isBreached ? "negative" : ticket.isAtRisk ? "warning" : "neutral"}
            />
          </ol>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-100">{value}</span>
    </li>
  );
}

function TimelineItem({
  when,
  title,
  body,
  tone = "neutral",
}: {
  when: string;
  title: string;
  body: string;
  tone?: "neutral" | "warning" | "negative";
}) {
  const dotColor =
    tone === "negative" ? "bg-rose-400" : tone === "warning" ? "bg-amber-400" : "bg-emerald-400";
  return (
    <li className="flex gap-3">
      <span className="relative mt-1 flex h-2 w-2 shrink-0">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-40 ${dotColor}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-zinc-100">{title}</div>
        <div className="text-zinc-400">{body}</div>
        <div className="text-[9px] uppercase tracking-wider text-zinc-500">
          {when.slice(0, 16).replace("T", " ")}
        </div>
      </div>
    </li>
  );
}
